import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getMercadoPagoPayment } from "@/lib/mercadopago/client"

interface CancelableOrder {
  id: string
  user_id: string
  status: string
  payment_status: string
  payment_id: string | null
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, payment_status, payment_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 },
      )
    }

    const typedOrder = order as CancelableOrder
    if (typedOrder.payment_status !== "pending") {
      return NextResponse.json(
        { error: "Apenas pedidos pendentes podem ser cancelados" },
        { status: 409 },
      )
    }

    if (typedOrder.payment_id) {
      await getMercadoPagoPayment().cancel({ id: typedOrder.payment_id })
    }

    const admin = createSupabaseAdminClient()
    await admin.rpc("release_order_stock", {
      p_order_id: typedOrder.id,
      p_reason: "user_cancelled",
    })

    const now = new Date().toISOString()
    await admin
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "failed",
        mp_status: "cancelled",
        payment_failure_reason: "Pedido cancelado pelo cliente",
        failed_at: now,
        updated_at: now,
      })
      .eq("id", typedOrder.id)
      .eq("payment_status", "pending")

    return NextResponse.json({ cancelled: true })
  } catch {
    console.error("[orders/cancel] Falha ao cancelar pedido")
    return NextResponse.json(
      { error: "Nao foi possivel cancelar o pedido" },
      { status: 500 },
    )
  }
}

