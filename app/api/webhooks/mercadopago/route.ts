import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getRequiredEnv } from "@/lib/env"
import { getMercadoPagoPayment } from "@/lib/mercadopago/client"
import { validateMercadoPagoWebhookSignature } from "@/lib/mercadopago/webhook"
import {
  mapMercadoPagoStatus,
  shouldKeepCurrentOrderStatus,
} from "@/lib/payments/status"

interface MercadoPagoWebhookBody {
  id?: string | number
  action?: string
  type?: string
  data?: {
    id?: string | number
  }
}

interface MercadoPagoPaymentInfo {
  id?: string | number | null
  status?: string | null
  status_detail?: string | null
  external_reference?: string | null
  payment_method_id?: string | null
  payment_type_id?: string | null
}

interface OrderPaymentState {
  id: string
  status: string
  payment_status: string
  stock_released_at: string | null
}

function jsonOk(extra: Record<string, unknown> = {}) {
  return NextResponse.json({ received: true, ...extra })
}

function eventKeyFor(
  body: MercadoPagoWebhookBody,
  paymentId: string,
  requestId: string,
) {
  if (body.id && body.action) return `${body.id}:${body.action}`
  return `${paymentId}:${body.action ?? body.type ?? "payment"}:${requestId}`
}

async function insertWebhookEvent(
  body: MercadoPagoWebhookBody,
  paymentId: string,
  requestId: string,
  payload: unknown,
) {
  const supabase = createSupabaseAdminClient()
  const eventKey = eventKeyFor(body, paymentId, requestId)
  const { data, error } = await supabase
    .from("mercadopago_payment_events")
    .insert({
      event_key: eventKey,
      event_id: body.id ? String(body.id) : null,
      payment_id: paymentId,
      action: body.action ?? null,
      event_type: body.type ?? null,
      x_request_id: requestId,
      payload,
    })
    .select("id")
    .single()

  if (error?.code === "23505") return { duplicate: true, eventId: null }
  if (error) throw new Error("Nao foi possivel registrar evento")
  return { duplicate: false, eventId: data.id as string }
}

async function markWebhookEventProcessed(
  eventId: string | null,
  errorMessage?: string,
) {
  if (!eventId) return

  const supabase = createSupabaseAdminClient()
  await supabase
    .from("mercadopago_payment_events")
    .update({
      processed: !errorMessage,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId)
}

async function findOrderForPayment(
  paymentInfo: MercadoPagoPaymentInfo,
  paymentId: string,
): Promise<OrderPaymentState | null> {
  const supabase = createSupabaseAdminClient()

  if (paymentInfo.external_reference) {
    const { data } = await supabase
      .from("orders")
      .select("id, status, payment_status, stock_released_at")
      .eq("external_reference", paymentInfo.external_reference)
      .maybeSingle()

    if (data) return data as OrderPaymentState
  }

  const { data } = await supabase
    .from("orders")
    .select("id, status, payment_status, stock_released_at")
    .eq("payment_id", paymentId)
    .maybeSingle()

  return (data as OrderPaymentState | null) ?? null
}

async function applyPaymentStatus(
  order: OrderPaymentState,
  paymentInfo: MercadoPagoPaymentInfo,
  paymentId: string,
) {
  const supabase = createSupabaseAdminClient()
  const mapping = mapMercadoPagoStatus(
    paymentInfo.status,
    paymentInfo.status_detail,
  )
  const now = new Date().toISOString()
  const nextOrderStatus = shouldKeepCurrentOrderStatus(order.status)
    ? order.status
    : mapping.orderStatus

  const { error } = await supabase
    .from("orders")
    .update({
      payment_id: paymentId,
      external_reference: paymentInfo.external_reference ?? order.id,
      payment_status: mapping.paymentStatus,
      status: nextOrderStatus,
      mp_status: paymentInfo.status ?? null,
      mp_status_detail: paymentInfo.status_detail ?? null,
      payment_failure_reason: mapping.failureReason,
      paid_at: mapping.paymentStatus === "paid" ? now : null,
      failed_at: mapping.paymentStatus === "failed" ? now : null,
      updated_at: now,
    })
    .eq("id", order.id)

  if (error) throw new Error("Nao foi possivel atualizar pedido")

  if (mapping.shouldConfirmStock) {
    await supabase.rpc("confirm_order_stock", { p_order_id: order.id })
  }

  if (mapping.shouldReleaseStock) {
    await supabase.rpc("release_order_stock", {
      p_order_id: order.id,
      p_reason: paymentInfo.status ?? "payment_failed",
    })
  }
}

export async function POST(request: NextRequest) {
  let eventId: string | null = null

  try {
    const body = (await request.json()) as MercadoPagoWebhookBody
    const paymentId = String(
      request.nextUrl.searchParams.get("data.id") ?? body.data?.id ?? "",
    )
    const requestId = request.headers.get("x-request-id") ?? ""
    const signatureHeader = request.headers.get("x-signature") ?? ""

    const validSignature = validateMercadoPagoWebhookSignature({
      dataId: paymentId,
      requestId,
      signatureHeader,
      secret: getRequiredEnv("MERCADOPAGO_WEBHOOK_SECRET"),
    })

    if (!validSignature) {
      return NextResponse.json({ received: false }, { status: 401 })
    }

    if (!paymentId) return jsonOk()

    if (body.type !== "payment" && body.action !== "payment.updated") {
      return jsonOk()
    }

    const inserted = await insertWebhookEvent(body, paymentId, requestId, body)
    if (inserted.duplicate) return jsonOk({ duplicate: true })
    eventId = inserted.eventId

    const paymentInfo = (await getMercadoPagoPayment().get({
      id: paymentId,
    })) as MercadoPagoPaymentInfo

    const order = await findOrderForPayment(paymentInfo, paymentId)
    if (!order) {
      await markWebhookEventProcessed(eventId)
      return jsonOk({ ignored: true })
    }

    await applyPaymentStatus(order, paymentInfo, paymentId)
    await markWebhookEventProcessed(eventId)

    return jsonOk()
  } catch (error) {
    console.error("[webhook/mercadopago] Falha ao processar webhook")
    await markWebhookEventProcessed(
      eventId,
      error instanceof Error ? error.message : "Erro desconhecido",
    )
    return NextResponse.json({ received: false }, { status: 500 })
  }
}
