import Link from "next/link"
import { Package, MapPin, User, ShieldCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { getUserOrders, getUserAddresses } from "@/lib/supabase/queries"

export const metadata = {
  title: "Minha conta — RodeioStore",
}

export default async function ContaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, is_admin")
    .eq("id", user!.id)
    .maybeSingle()

  const [orders, addresses] = await Promise.all([
    getUserOrders(user!.id),
    getUserAddresses(user!.id),
  ])

  const displayName =
    profile?.full_name ??
    (user!.user_metadata?.full_name as string | undefined) ??
    user!.email

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Olá, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo à sua área pessoal do RodeioStore.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/conta/pedidos" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="size-5 text-muted-foreground" />
                <CardTitle>Meus pedidos</CardTitle>
              </div>
              <CardDescription>
                Acompanhe o status dos pedidos feitos na loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {orders.length === 0
                  ? "Você ainda não fez nenhum pedido."
                  : `${orders.length} pedido${orders.length > 1 ? "s" : ""} realizado${orders.length > 1 ? "s" : ""}.`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/conta/enderecos" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-muted-foreground" />
                <CardTitle>Endereços</CardTitle>
              </div>
              <CardDescription>
                Salve endereços para finalizar a compra mais rápido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {addresses.length === 0
                  ? "Nenhum endereço cadastrado."
                  : `${addresses.length} endereço${addresses.length > 1 ? "s" : ""} salvo${addresses.length > 1 ? "s" : ""}.`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/conta/perfil" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-muted-foreground" />
                <CardTitle>Perfil</CardTitle>
              </div>
              <CardDescription>
                Atualize seus dados pessoais de contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Nome:</span>{" "}
                {profile?.full_name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {user!.email}
              </p>
            </CardContent>
          </Card>
        </Link>

        {profile?.is_admin ? (
          <Link href="/admin" className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                  <CardTitle>Painel administrativo</CardTitle>
                </div>
                <CardDescription>
                  Você tem acesso à gestão da loja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">Acessar /admin</p>
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
