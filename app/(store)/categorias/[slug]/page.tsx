import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getCategoryBySlug, getProducts } from "@/lib/supabase/queries"
import { ProductGrid } from "@/components/store/product-grid"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: "Categoria não encontrada — RodeioStore" }
  return {
    title: `${category.name} — RodeioStore`,
    description:
      category.description ?? `Confira produtos da categoria ${category.name}.`,
  }
}

export default async function CategoriaPage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) notFound()

  const products = await getProducts({ categorySlug: slug })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/produtos" className="hover:text-foreground">
          Produtos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {category.description}
          </p>
        ) : null}
      </header>

      <ProductGrid
        products={products}
        emptyMessage={`Nenhum produto encontrado em "${category.name}".`}
      />
    </div>
  )
}
