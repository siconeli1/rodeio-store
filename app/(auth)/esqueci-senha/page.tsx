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
import { requestPasswordResetAction } from "./actions"

type SearchParams = Promise<{ error?: string }>

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Informe o email da sua conta. Vamos enviar um link para você definir
          uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={requestPasswordResetAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
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
            Enviar link de recuperação
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link
            href="/entrar"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
