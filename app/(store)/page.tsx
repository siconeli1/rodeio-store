import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCategories, getFeaturedProducts } from "@/lib/supabase/queries"
import { ProductGrid } from "@/components/store/product-grid"

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-20 text-center md:py-28">
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Moda Country &middot; Estilo que vem do campo
        </span>
        <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Vista o espírito do rodeio
        </h1>
        <p className="max-w-lg text-base text-muted-foreground md:text-lg">
          Camisas xadrez, botas texanas, chapéus de couro e muito mais.
          Encontre tudo para o seu estilo country em um só lugar.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/produtos">Ver produtos</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#categorias">Categorias</Link>
          </Button>
        </div>
      </section>

      {/* Produtos em destaque */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
              Destaques
            </h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/produtos">
                Ver todos <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={featured} />
        </section>
      ) : null}

      {/* Categorias */}
      <section id="categorias" className="bg-muted/30 px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="mb-6 font-heading text-xl font-semibold tracking-tight md:text-2xl">
            Categorias
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl bg-background p-5 text-center ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg transition-colors group-hover:bg-foreground group-hover:text-background">
                  {cat.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
