import Link from "next/link"
import Image from "next/image"
import { Package } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserOrders } from "@/lib/supabase/queries"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/format"

export const metadata = {
  title: "Meus pedidos — RodeioStore",
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

export default async function PedidosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?next=/conta/pedidos")

  const orders = await getUserOrders(user.id)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Meus pedidos
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status de todas as suas compras.
        </p>
      </header>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Você ainda não realizou nenhum pedido.
          </p>
          <Link
            href="/produtos"
            className="text-sm font-medium underline underline-offset-4"
          >
            Explorar produtos
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const firstItem = order.order_items[0]
            const status = ORDER_STATUS_MAP[order.status] ?? ORDER_STATUS_MAP.pending
            const date = new Date(order.created_at).toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "short", year: "numeric" },
            )

            return (
              <Link key={order.id} href={`/conta/pedidos/${order.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
                  {/* Imagem do primeiro produto */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {firstItem?.product_image ? (
                      <Image
                        src={firstItem.product_image}
                        alt={firstItem.product_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge
                        className={status.className}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {date} &middot;{" "}
                      {order.order_items.length} item{order.order_items.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Total */}
                  <span className="shrink-0 text-sm font-semibold">
                    {formatPrice(order.total)}
                  </span>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
