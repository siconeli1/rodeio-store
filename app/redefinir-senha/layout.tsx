import Link from "next/link"

export default function RedefinirSenhaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Diferente de /entrar e /cadastrar, esta rota fica fora do grupo (auth)
  // porque o usuário chega aqui com sessão ativa (criada pelo callback do
  // email) e NÃO deve ser redirecionado para /conta antes de trocar a senha.
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="font-heading text-2xl font-semibold tracking-tight"
          >
            RodeioStore
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina uma nova senha de acesso
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
