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
import { signInAction } from "./actions"

type SearchParams = Promise<{ error?: string; success?: string; next?: string }>

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error, success, next } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para acompanhar pedidos e endereços.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signInAction} className="space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}

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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/esqueci-senha"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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

          {success ? (
            <p
              role="status"
              className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800"
            >
              {success}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href="/cadastrar"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
