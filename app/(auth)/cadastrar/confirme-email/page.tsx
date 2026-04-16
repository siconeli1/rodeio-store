import Link from "next/link"
import { MailCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type SearchParams = Promise<{ email?: string }>

export default async function ConfirmeEmailPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { email } = await searchParams

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <CardTitle className="text-center">Confirme seu email</CardTitle>
        <CardDescription className="text-center">
          Enviamos um link de confirmação para{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "o endereço cadastrado"
          )}
          .
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ol className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-medium text-foreground">1.</span>
            <span>Abra sua caixa de entrada (e confira o spam).</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">2.</span>
            <span>Clique no link “Confirmar meu email” recebido.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">3.</span>
            <span>Volte aqui e entre com seu email e senha.</span>
          </li>
        </ol>

        <p className="text-center text-xs text-muted-foreground">
          O link expira em 24 horas. Não recebeu? Verifique o endereço digitado
          ou cadastre-se novamente.
        </p>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href="/entrar">Ir para o login</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/cadastrar">Usar outro email</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
