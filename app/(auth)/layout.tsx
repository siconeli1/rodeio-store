import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Usuário já autenticado não deve ver /entrar ou /cadastrar
  if (user) {
    redirect("/conta")
  }

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
            Moda country para quem vive no rodeio
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
