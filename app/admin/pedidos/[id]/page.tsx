import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { ArrowLeft, MapPin, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/format"
import { OrderStatusSelect } from "../order-status-select"
import type { OrderWithItems } from "@/types/database"

export const metadata = {
  title: "Detalhe do pedido — Admin RodeioStore",
}

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-200" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800 border-red-200" },
}

export default async function AdminPedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle()

  if (!data) redirect("/admin/pedidos")

  const order = data as unknown as OrderWithItems
  const paymentInfo =
    PAYMENT_STATUS_MAP[order.payment_status] ?? PAYMENT_STATUS_MAP.pending
  const address = order.address_snapshot

  const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/pedidos">
          <ArrowLeft className="mr-1 size-4" />
          Voltar para Pedidos
        </Link>
      </Button>

      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">{orderDate}</p>
        </div>
        <OrderStatusSelect
          orderId={order.id}
          currentStatus={order.status}
        />
      </header>

      {/* Pagamento */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Pagamento</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={paymentInfo.className}>
                {paymentInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {order.payment_method === "pix" ? "PIX" : "Cartão de crédito"}
              </span>
            </div>
            {order.payment_failure_reason ? (
              <p className="mt-2 text-xs text-destructive">
                {order.payment_failure_reason}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Itens */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Itens do pedido</h2>
        <ul className="space-y-3">
          {order.order_items.map((item) => (
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
                <span className="shrink-0 font-medium">
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
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>{formatPrice(order.shipping_cost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Endereço */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="size-5 text-muted-foreground" />
          <h2 className="font-semibold">Endereço de entrega</h2>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">{address.full_name}</p>
          <p>
            {address.street}, {address.number}
            {address.complement ? ` — ${address.complement}` : ""}
          </p>
          <p>
            {address.neighborhood} — {address.city}/{address.state}
          </p>
          <p>CEP: {address.zip_code}</p>
          {address.phone && <p>Tel: {address.phone}</p>}
        </div>
      </Card>
    </div>
  )
}
