import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { payment as mpPayment } from "@/lib/mercadopago/client"

function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mercado Pago envia type "payment" para notificações de pagamento
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    // Buscar status atualizado diretamente no Mercado Pago
    const paymentInfo = await mpPayment.get({ id: paymentId })
    const mpStatus = paymentInfo.status // approved, pending, rejected, etc.

    const supabase = createSupabaseAdmin()

    // Mapear status do MP para o nosso schema
    let paymentStatus: "pending" | "paid" | "failed"
    let orderStatus: "pending" | "processing"

    switch (mpStatus) {
      case "approved":
        paymentStatus = "paid"
        orderStatus = "processing"
        break
      case "rejected":
      case "cancelled":
        paymentStatus = "failed"
        orderStatus = "pending"
        break
      default:
        paymentStatus = "pending"
        orderStatus = "pending"
    }

    // Atualizar pedido pelo payment_id
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", String(paymentId))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[webhook/mercadopago] Erro:", error)
    // Retornar 200 para que o MP não reenvie indefinidamente
    return NextResponse.json({ received: true })
  }
}
