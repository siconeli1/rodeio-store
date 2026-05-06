import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

interface OrderStatusRow {
  id: string
  status: string
  payment_status: "pending" | "paid" | "failed"
  payment_method: "pix" | "credit_card"
  pix_expires_at: string | null
  payment_failure_reason: string | null
  mp_status: string | null
}

function isExpiredPix(order: OrderStatusRow): boolean {
  return Boolean(
    order.payment_method === "pix" &&
      order.payment_status === "pending" &&
      order.pix_expires_at &&
      new Date(order.pix_expires_at).getTime() <= Date.now(),
  )
}

async function expirePixOrder(orderId: string): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const now = new Date().toISOString()

  await supabase.rpc("release_order_stock", {
    p_order_id: orderId,
    p_reason: "pix_expired",
  })

  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      mp_status: "expired",
      payment_failure_reason: "Pagamento PIX expirado",
      failed_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
}

function serializeOrderStatus(order: OrderStatusRow) {
  const expired = isExpiredPix(order)
  const paymentStatus = expired ? "failed" : order.payment_status
  const orderStatus = expired ? "cancelled" : order.status
  const failureReason = expired
    ? "Pagamento PIX expirado"
    : order.payment_failure_reason

  return {
    id: order.id,
    status: orderStatus,
    orderStatus,
    paymentStatus,
    paymentMethod: order.payment_method,
    expiresAt: order.pix_expires_at,
    canRetry: paymentStatus === "failed" || orderStatus === "cancelled",
    failureReason,
  }
}

export async function GET(
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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, status, payment_status, payment_method, pix_expires_at, payment_failure_reason, mp_status",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 },
      )
    }

    const typedOrder = order as OrderStatusRow
    if (isExpiredPix(typedOrder)) {
      await expirePixOrder(typedOrder.id)
    }

    return NextResponse.json(serializeOrderStatus(typedOrder))
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
