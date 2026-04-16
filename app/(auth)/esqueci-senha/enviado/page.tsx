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

export default async function EmailEnviadoPage({
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
        <CardTitle className="text-center">Link enviado</CardTitle>
        <CardDescription className="text-center">
          Se existir uma conta associada a{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "esse endereço"
          )}
          , você receberá um link para redefinir a senha em instantes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">
          Não recebeu? Confira a caixa de spam ou solicite novamente em alguns
          minutos.
        </p>

        <Button asChild size="lg" className="w-full">
          <Link href="/entrar">Voltar para o login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
