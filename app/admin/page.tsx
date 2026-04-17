import Link from "next/link"
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  Tags,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/format"
import { SalesChart } from "@/components/admin/sales-chart"

export const metadata = {
  title: "Painel Admin — RodeioStore",
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Buscar métricas em paralelo
  const [ordersRes, paidOrdersRes, outOfStockRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid"),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("stock", 0),
  ])

  const totalOrders = ordersRes.count ?? 0
  const totalSales = (paidOrdersRes.data ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0,
  )
  const outOfStock = outOfStockRes.count ?? 0

  // Vendas dos últimos 7 dias
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("payment_status", "paid")
    .gte("created_at", sevenDaysAgo.toISOString())

  // Agrupar vendas por dia
  const salesByDay = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
    salesByDay.set(key, 0)
  }
  for (const order of recentOrders ?? []) {
    const key = new Date(order.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
    if (salesByDay.has(key)) {
      salesByDay.set(key, salesByDay.get(key)! + Number(order.total))
    }
  }
  const chartData = Array.from(salesByDay, ([day, total]) => ({ day, total }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da loja.
        </p>
      </header>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de vendas
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalSales)}</p>
            <p className="text-xs text-muted-foreground">
              Pedidos com pagamento confirmado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos
            </CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">
              Total de pedidos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem estoque
            </CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{outOfStock}</p>
            <p className="text-xs text-muted-foreground">
              Variantes com estoque zerado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas dos últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={chartData} />
        </CardContent>
      </Card>

      {/* Links rápidos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link href="/admin/produtos">
            <Package className="size-5" />
            <div className="text-left">
              <p className="font-medium">Produtos</p>
              <p className="text-xs text-muted-foreground">
                Gerenciar catálogo
              </p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link href="/admin/categorias">
            <Tags className="size-5" />
            <div className="text-left">
              <p className="font-medium">Categorias</p>
              <p className="text-xs text-muted-foreground">
                Organizar produtos
              </p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link href="/admin/pedidos">
            <ShoppingCart className="size-5" />
            <div className="text-left">
              <p className="font-medium">Pedidos</p>
              <p className="text-xs text-muted-foreground">
                Acompanhar vendas
              </p>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}
