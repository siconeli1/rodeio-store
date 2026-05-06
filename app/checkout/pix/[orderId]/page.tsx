import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PixPayment } from "@/components/checkout/pix-payment"

export const metadata = {
  title: "Pagamento PIX — RodeioStore",
}

export default async function PixPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar")

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, payment_method, payment_status, pix_qr_code, pix_qr_code_base64, pix_expires_at, payment_failure_reason",
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (!order || order.payment_method !== "pix") {
    redirect("/")
  }

  // Se já foi pago, redirecionar para sucesso
  if (order.payment_status === "paid") {
    redirect(`/checkout/sucesso/${orderId}`)
  }

  return (
    <PixPayment
      orderId={order.id}
      qrCode={order.pix_qr_code}
      qrCodeBase64={order.pix_qr_code_base64}
      expiresAt={order.pix_expires_at}
      initialPaymentStatus={order.payment_status}
      failureReason={order.payment_failure_reason}
    />
  )
}
