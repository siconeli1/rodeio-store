import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?next=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.is_admin) redirect("/conta?erro=admin")

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r bg-muted/40 md:block">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/admin"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            RodeioStore
          </Link>
          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Admin
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar à loja
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Link
            href="/admin"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            RodeioStore
          </Link>
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Admin
          </span>
          <nav className="ml-auto flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={item.label}
              >
                <item.icon className="size-4" />
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
