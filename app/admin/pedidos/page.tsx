import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/format"
import { OrderStatusSelect } from "./order-status-select"
import { OrderFilter } from "./order-filter"

export const metadata = {
  title: "Pedidos — Admin RodeioStore",
}

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-200" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800 border-red-200" },
}

interface OrderRow {
  id: string
  status: string
  payment_status: string
  payment_method: string
  total: number
  created_at: string
  address_snapshot: { full_name: string }
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("id, status, payment_status, payment_method, total, created_at, address_snapshot")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data } = await query
  const orders = (data ?? []) as OrderRow[]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os pedidos da loja.
          </p>
        </div>
        <OrderFilter />
      </header>

      {orders.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Cliente
                </TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Pagamento
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const paymentInfo =
                  PAYMENT_STATUS_MAP[order.payment_status] ??
                  PAYMENT_STATUS_MAP.pending
                const date = new Date(order.created_at).toLocaleDateString(
                  "pt-BR",
                  { day: "2-digit", month: "short", year: "numeric" },
                )
                const clientName =
                  order.address_snapshot?.full_name ?? "—"

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {clientName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {date}
                    </TableCell>
                    <TableCell>
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.status}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={paymentInfo.className}>
                        {paymentInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
