import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { updatePasswordAction } from "./actions"

type SearchParams = Promise<{ error?: string }>

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  // Exige sessão de recuperação. Sem ela, o link do email não foi processado.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido ou expirado</CardTitle>
          <CardDescription>
            Não encontramos uma solicitação de recuperação válida. Solicite um
            novo link para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/esqueci-senha">Solicitar novo link</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova senha</CardTitle>
        <CardDescription>
          Escolha uma senha nova para acessar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePasswordAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 6 caracteres.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            Salvar nova senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
