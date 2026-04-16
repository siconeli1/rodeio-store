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
import { signUpAction } from "./actions"

type SearchParams = Promise<{ error?: string }>

export default async function CadastrarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Cadastre-se para comprar e acompanhar seus pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUpAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Seu nome"
            />
          </div>

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
            <Label htmlFor="password">Senha</Label>
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

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            Criar conta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
