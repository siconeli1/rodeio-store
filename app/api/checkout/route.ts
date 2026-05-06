import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getMercadoPagoPayment } from "@/lib/mercadopago/client"
import { checkoutSchema } from "@/lib/checkout-schema"
import { getAppUrl } from "@/lib/url"
import {
  mapMercadoPagoStatus,
  shouldKeepCurrentOrderStatus,
} from "@/lib/payments/status"
import { getShippingCost } from "@/lib/shipping"

const PIX_EXPIRATION_MINUTES = 30

interface CheckoutOrderResult {
  orderId: string
  subtotal: number
  shippingCost: number
  total: number
  paymentId: string | null
  paymentMethod: "pix" | "credit_card"
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: string
  pixQrCode: string | null
  pixQrCodeBase64: string | null
  pixExpiresAt: string | null
  wasExisting: boolean
}

interface MercadoPagoPaymentLike {
  id?: string | number | null
  status?: string | null
  status_detail?: string | null
  payment_method_id?: string | null
  payment_type_id?: string | null
  external_reference?: string | null
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null
      qr_code_base64?: string | null
      ticket_url?: string | null
    }
  } | null
}

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

function getIdempotencyKey(request: NextRequest): string | null {
  const key = request.headers.get("x-idempotency-key")?.trim()
  if (!key || key.length < 12 || key.length > 120) return null
  return key
}

function getPixExpiration(): string {
  return new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000).toISOString()
}

function rpcItems(
  items: Array<{ variantId: string; quantity: number }>,
): Array<{ variant_id: string; quantity: number }> {
  return items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }))
}

function checkoutError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function mapCheckoutRpcError(message: string): string {
  if (message.startsWith("INSUFFICIENT_STOCK:")) {
    const productName = message.split(":", 2)[1] || "um item do carrinho"
    return `Estoque insuficiente para "${productName}"`
  }

  const known: Record<string, string> = {
    EMPTY_CART: "O carrinho esta vazio",
    INVALID_IDEMPOTENCY_KEY: "Tentativa de checkout invalida",
    INVALID_PAYMENT_METHOD: "Metodo de pagamento invalido",
    INVALID_QUANTITY: "Quantidade invalida no carrinho",
    ITEM_UNAVAILABLE: "Um ou mais itens estao indisponiveis",
  }

  return known[message] ?? "Nao foi possivel criar o pedido"
}

async function markPaymentCreationFailed(orderId: string, reason: string) {
  const supabase = createSupabaseAdminClient()
  await supabase.rpc("release_order_stock", {
    p_order_id: orderId,
    p_reason: "payment_create_failed",
  })
  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      payment_failure_reason: reason,
      failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
}

async function recordPaymentCreateEvent(
  paymentInfo: MercadoPagoPaymentLike,
  orderId: string,
) {
  if (!paymentInfo.id) return

  const supabase = createSupabaseAdminClient()
  await supabase.from("mercadopago_payment_events").upsert(
    {
      event_key: `payment.create:${paymentInfo.id}`,
      event_id: `payment.create:${paymentInfo.id}`,
      payment_id: String(paymentInfo.id),
      action: "payment.create",
      event_type: "payment",
      payload: {
        order_id: orderId,
        status: paymentInfo.status ?? null,
        status_detail: paymentInfo.status_detail ?? null,
      },
      processed: true,
      processed_at: new Date().toISOString(),
    },
    { onConflict: "event_key" },
  )
}

async function updateOrderFromPayment(
  order: CheckoutOrderResult,
  paymentInfo: MercadoPagoPaymentLike,
) {
  if (!paymentInfo.id) {
    throw new Error("Mercado Pago nao retornou payment_id")
  }

  const supabase = createSupabaseAdminClient()
  const mapping = mapMercadoPagoStatus(
    paymentInfo.status,
    paymentInfo.status_detail,
  )
  const nextOrderStatus = shouldKeepCurrentOrderStatus(order.orderStatus)
    ? order.orderStatus
    : mapping.orderStatus
  const now = new Date().toISOString()
  const pixData = paymentInfo.point_of_interaction?.transaction_data

  await supabase
    .from("orders")
    .update({
      payment_id: String(paymentInfo.id),
      external_reference: order.orderId,
      payment_status: mapping.paymentStatus,
      status: nextOrderStatus,
      mp_status: paymentInfo.status ?? null,
      mp_status_detail: paymentInfo.status_detail ?? null,
      payment_failure_reason: mapping.failureReason,
      pix_qr_code: pixData?.qr_code ?? order.pixQrCode,
      pix_qr_code_base64: pixData?.qr_code_base64 ?? order.pixQrCodeBase64,
      pix_expires_at: order.pixExpiresAt,
      paid_at: mapping.paymentStatus === "paid" ? now : null,
      failed_at: mapping.paymentStatus === "failed" ? now : null,
      updated_at: now,
    })
    .eq("id", order.orderId)

  if (mapping.shouldConfirmStock) {
    await supabase.rpc("confirm_order_stock", { p_order_id: order.orderId })
  }

  if (mapping.shouldReleaseStock) {
    await supabase.rpc("release_order_stock", {
      p_order_id: order.orderId,
      p_reason: paymentInfo.status ?? "payment_failed",
    })
  }

  await recordPaymentCreateEvent(paymentInfo, order.orderId)

  return {
    paymentId: String(paymentInfo.id),
    paymentStatus: mapping.paymentStatus,
    orderStatus: nextOrderStatus,
    pixQrCode: pixData?.qr_code ?? order.pixQrCode,
    pixQrCodeBase64: pixData?.qr_code_base64 ?? order.pixQrCodeBase64,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user?.email) {
      return checkoutError("Nao autenticado", 401)
    }

    const idempotencyKey = getIdempotencyKey(request)
    if (!idempotencyKey) {
      return checkoutError("Tentativa de checkout invalida", 400)
    }

    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { address, items, payment } = parsed.data
    const shippingCost = getShippingCost()
    const pixExpiresAt =
      payment.method === "pix" ? getPixExpiration() : null
    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase.rpc("create_checkout_order", {
      p_user_id: user.id,
      p_checkout_attempt_id: idempotencyKey,
      p_payment_method: payment.method,
      p_address_snapshot: address,
      p_items: rpcItems(items),
      p_shipping_cost: shippingCost,
      p_pix_expires_at: pixExpiresAt,
    })

    if (error || !data) {
      return checkoutError(mapCheckoutRpcError(error?.message ?? ""), 400)
    }

    const order = data as unknown as CheckoutOrderResult

    if (order.paymentId) {
      return NextResponse.json({
        orderId: order.orderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        pixQrCode: order.pixQrCode,
        pixQrCodeBase64: order.pixQrCodeBase64,
        pixExpiresAt: order.pixExpiresAt,
      })
    }

    if (order.wasExisting && order.paymentStatus === "failed") {
      return checkoutError(
        "Esta tentativa de checkout ja falhou. Inicie uma nova tentativa.",
        409,
      )
    }

    const paymentClient = getMercadoPagoPayment()
    const appUrl = getAppUrl()
    const mpIdempotencyKey = `order-${order.orderId}`

    try {
      if (payment.method === "pix") {
        const mpPayment = await paymentClient.create({
          body: {
            transaction_amount: order.total,
            payment_method_id: "pix",
            payer: {
              email: user.email,
              identification: { type: "CPF", number: payment.cpf },
            },
            description: "RodeioStore - Pedido",
            external_reference: order.orderId,
            date_of_expiration: order.pixExpiresAt ?? pixExpiresAt ?? undefined,
            notification_url: `${appUrl}/api/webhooks/mercadopago`,
          },
          requestOptions: { idempotencyKey: mpIdempotencyKey },
        })

        const updated = await updateOrderFromPayment(
          order,
          mpPayment as MercadoPagoPaymentLike,
        )

        return NextResponse.json({
          orderId: order.orderId,
          paymentMethod: "pix",
          paymentStatus: updated.paymentStatus,
          orderStatus: updated.orderStatus,
          pixQrCode: updated.pixQrCode,
          pixQrCodeBase64: updated.pixQrCodeBase64,
          pixExpiresAt: order.pixExpiresAt,
        })
      }

      const issuerId = payment.issuerId ? Number(payment.issuerId) : undefined
      const mpPayment = await paymentClient.create({
        body: {
          transaction_amount: order.total,
          token: payment.token,
          payment_method_id: payment.paymentMethodId,
          issuer_id:
            issuerId && Number.isFinite(issuerId) ? issuerId : undefined,
          installments: payment.installments,
          payer: {
            email: user.email,
            identification: { type: "CPF", number: payment.cpf },
          },
          description: "RodeioStore - Pedido",
          external_reference: order.orderId,
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
        },
        requestOptions: { idempotencyKey: mpIdempotencyKey },
      })

      const updated = await updateOrderFromPayment(
        order,
        mpPayment as MercadoPagoPaymentLike,
      )

      return NextResponse.json({
        orderId: order.orderId,
        paymentMethod: "credit_card",
        paymentStatus: updated.paymentStatus,
        orderStatus: updated.orderStatus,
      })
    } catch {
      console.error("[checkout] Falha ao criar pagamento no Mercado Pago")
      await markPaymentCreationFailed(
        order.orderId,
        "Falha ao criar pagamento",
      )
      return checkoutError("Erro ao criar pagamento. Tente novamente.", 502)
    }
  } catch {
    console.error("[checkout] Erro inesperado")
    return checkoutError("Erro interno ao processar pagamento", 500)
  }
}
