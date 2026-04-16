import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { CheckCircle2, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/format"
import type { OrderWithItems } from "@/types/database"

export const metadata = {
  title: "Pedido confirmado — RodeioStore",
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
}

const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "Pendente",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

export default async function SuccessPage({
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
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (!order) redirect("/")

  const typedOrder = order as unknown as OrderWithItems
  const paymentInfo = PAYMENT_STATUS_MAP[typedOrder.payment_status] ?? PAYMENT_STATUS_MAP.pending
  const orderDate = new Date(typedOrder.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">Pedido realizado!</h1>
        <p className="text-sm text-muted-foreground">
          Obrigado pela sua compra. Acompanhe o status do seu pedido abaixo.
        </p>
      </div>

      {/* Info do pedido */}
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Número do pedido</p>
            <p className="font-mono text-sm font-medium">
              {typedOrder.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="text-sm">{orderDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status do pedido</p>
            <div className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <span className="text-sm">
                {ORDER_STATUS_MAP[typedOrder.status] ?? typedOrder.status}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pagamento</p>
            <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
            <span className="ml-2 text-xs text-muted-foreground">
              ({typedOrder.payment_method === "pix" ? "PIX" : "Cartão de crédito"})
            </span>
          </div>
        </div>
      </Card>

      {/* Itens */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Itens do pedido</h2>
        <ul className="space-y-3">
          {typedOrder.order_items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex flex-1 items-start justify-between text-sm">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.color} / {item.size} &middot; Qtd: {item.quantity}
                  </p>
                </div>
                <span className="font-medium">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(typedOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>{formatPrice(typedOrder.shipping_cost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(typedOrder.total)}</span>
          </div>
        </div>
      </Card>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/produtos">Continuar comprando</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/conta">Meus pedidos</Link>
        </Button>
      </div>
    </div>
  )
}
