import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUserOrderById } from "@/lib/supabase/queries"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/format"

export const metadata = {
  title: "Detalhe do pedido — RodeioStore",
}

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-200" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800 border-red-200" },
}

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  processing: { label: "Em processamento", className: "bg-blue-100 text-blue-800 border-blue-200" },
  shipped: { label: "Enviado", className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Entregue", className: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
}

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?next=/conta/pedidos")

  const order = await getUserOrderById(user.id, id)

  if (!order) redirect("/conta/pedidos")

  const paymentInfo =
    PAYMENT_STATUS_MAP[order.payment_status] ?? PAYMENT_STATUS_MAP.pending
  const orderStatus =
    ORDER_STATUS_MAP[order.status] ?? ORDER_STATUS_MAP.pending
  const address = order.address_snapshot

  const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/conta/pedidos">
          <ArrowLeft className="mr-1 size-4" />
          Voltar para Pedidos
        </Link>
      </Button>

      {/* Cabeçalho */}
      <header className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge className={orderStatus.className}>{orderStatus.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{orderDate}</p>
      </header>

      {/* Status do pagamento */}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Pagamento</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={paymentInfo.className}>
                  {paymentInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {order.payment_method === "pix"
                    ? "PIX"
                    : "Cartão de crédito"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status do pedido</p>
              <p className="mt-1 text-sm font-medium">{orderStatus.label}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Itens do pedido */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Itens do pedido</h2>
        <ul className="space-y-3">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="64px"
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

        {/* Totais */}
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

      {/* Endereço de entrega (snapshot) */}
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
