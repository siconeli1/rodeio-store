import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function ContaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin")
    .eq("id", user!.id)
    .maybeSingle()

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
        <Card>
          <CardHeader>
            <CardTitle>Meus pedidos</CardTitle>
            <CardDescription>
              Acompanhe o status dos pedidos feitos na loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você ainda não fez nenhum pedido.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereços</CardTitle>
            <CardDescription>
              Salve endereços para finalizar a compra mais rápido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum endereço cadastrado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
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
              <span className="text-muted-foreground">Email:</span> {user!.email}
            </p>
          </CardContent>
        </Card>

        {profile?.is_admin ? (
          <Card>
            <CardHeader>
              <CardTitle>Painel administrativo</CardTitle>
              <CardDescription>
                Você tem acesso à gestão da loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/admin"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Acessar /admin
              </a>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
