import Link from "next/link"
import { redirect } from "next/navigation"
import { Header } from "@/components/store/header"
import { createClient } from "@/lib/supabase/server"

const NAV_ITEMS = [
  { href: "/conta", label: "Início" },
  { href: "/conta/pedidos", label: "Meus pedidos" },
  { href: "/conta/enderecos", label: "Endereços" },
  { href: "/conta/perfil", label: "Perfil" },
]

export default async function ContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // O middleware já bloqueia, mas reforçamos no layout como defesa em profundidade.
  if (!user) {
    redirect("/entrar?next=/conta")
  }

  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row md:gap-10">
        <aside className="md:w-56 md:shrink-0">
          <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
