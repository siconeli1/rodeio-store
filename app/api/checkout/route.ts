import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { payment } from "@/lib/mercadopago/client"
import { checkoutSchema } from "@/lib/checkout-schema"

const SHIPPING_COST = 15

function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { address, items, payment: paymentData } = parsed.data
    const supabase = createSupabaseAdmin()

    // Validar estoque e preços atuais
    const variantIds = items.map((i) => i.variantId)
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, product_id, stock, size, color")
      .in("id", variantIds)

    if (variantsError || !variants || variants.length !== items.length) {
      return NextResponse.json(
        { error: "Um ou mais itens não foram encontrados" },
        { status: 400 },
      )
    }

    const productIds = [...new Set(variants.map((v) => v.product_id))]
    const { data: products } = await supabase
      .from("products")
      .select("id, price, name")
      .in("id", productIds)
      .eq("is_active", true)

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "Produtos indisponíveis" },
        { status: 400 },
      )
    }

    const productMap = new Map(products.map((p) => [p.id, p]))
    const variantMap = new Map(variants.map((v) => [v.id, v]))

    // Validar estoque
    for (const item of items) {
      const variant = variantMap.get(item.variantId)
      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${item.name}"` },
          { status: 400 },
        )
      }
    }

    // Calcular subtotal com preços do banco (prevenção de fraude)
    let subtotal = 0
    const orderItems = items.map((item) => {
      const variant = variantMap.get(item.variantId)!
      const product = productMap.get(variant.product_id)!
      subtotal += product.price * item.quantity
      return {
        product_id: variant.product_id,
        variant_id: item.variantId,
        product_name: item.name,
        product_image: item.image || null,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unit_price: product.price,
      }
    })

    const total = subtotal + SHIPPING_COST

    // Processar pagamento via Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const idempotencyKey = `${user.id}-${Date.now()}`

    if (paymentData.method === "pix") {
      const mpPayment = await payment.create({
        body: {
          transaction_amount: total,
          payment_method_id: "pix",
          payer: {
            email: user.email!,
            identification: { type: "CPF", number: paymentData.cpf },
          },
          description: `RodeioStore - Pedido`,
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
        },
        requestOptions: { idempotencyKey },
      })

      const pixData = mpPayment.point_of_interaction?.transaction_data
      const expiresAt = new Date(
        Date.now() + 30 * 60 * 1000,
      ).toISOString()

      // Criar pedido no banco
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          payment_method: "pix",
          payment_status: "pending",
          payment_id: String(mpPayment.id),
          pix_qr_code: pixData?.qr_code ?? null,
          pix_qr_code_base64: pixData?.qr_code_base64 ?? null,
          pix_expires_at: expiresAt,
          subtotal,
          shipping_cost: SHIPPING_COST,
          total,
          address_snapshot: address,
        })
        .select("id")
        .single()

      if (orderError || !order) {
        return NextResponse.json(
          { error: "Erro ao criar pedido" },
          { status: 500 },
        )
      }

      // Inserir itens do pedido
      await supabase
        .from("order_items")
        .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))

      // Decrementar estoque
      for (const item of items) {
        await supabase.rpc("decrement_stock", {
          p_variant_id: item.variantId,
          p_quantity: item.quantity,
        }).then(({ error }) => {
          if (error) {
            // Fallback: update direto
            return supabase
              .from("product_variants")
              .update({ stock: variantMap.get(item.variantId)!.stock - item.quantity })
              .eq("id", item.variantId)
          }
        })
      }

      return NextResponse.json({
        orderId: order.id,
        paymentMethod: "pix",
        pixQrCode: pixData?.qr_code ?? null,
        pixQrCodeBase64: pixData?.qr_code_base64 ?? null,
        pixExpiresAt: expiresAt,
      })
    }

    // Cartão de crédito
    const mpPayment = await payment.create({
      body: {
        transaction_amount: total,
        payment_method_id: "master",
        payer: {
          email: user.email!,
          identification: { type: "CPF", number: paymentData.cpf },
        },
        token: paymentData.cardNumber, // Em produção seria o card token do SDK frontend
        description: `RodeioStore - Pedido`,
        installments: paymentData.installments,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      },
      requestOptions: { idempotencyKey },
    })

    const paymentStatus = mpPayment.status === "approved" ? "paid" : "pending"
    const orderStatus = paymentStatus === "paid" ? "processing" : "pending"

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: orderStatus,
        payment_method: "credit_card",
        payment_status: paymentStatus,
        payment_id: String(mpPayment.id),
        subtotal,
        shipping_cost: SHIPPING_COST,
        total,
        address_snapshot: address,
      })
      .select("id")
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 },
      )
    }

    await supabase
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))

    // Decrementar estoque
    for (const item of items) {
      await supabase
        .from("product_variants")
        .update({ stock: variantMap.get(item.variantId)!.stock - item.quantity })
        .eq("id", item.variantId)
    }

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "credit_card",
      paymentStatus,
    })
  } catch (error) {
    console.error("[checkout] Erro:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento" },
      { status: 500 },
    )
  }
}
