import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { signOutAction } from "@/app/auth/actions"
import { CartButton } from "./cart-button"

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            RodeioStore
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/produtos">Produtos</Link>
            </Button>
          </nav>
        </div>

        <nav className="flex items-center gap-2">
          <CartButton />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/conta">Minha conta</Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/cadastrar">Cadastrar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
