import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getProductBySlug } from "@/lib/supabase/queries"
import { ProductDetail } from "@/components/store/product-detail"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Produto não encontrado" }
  const description =
    product.description ?? `Confira ${product.name} na RodeioStore.`
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.length ? [{ url: product.images[0] }] : undefined,
    },
  }
}

export default async function ProdutoPage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/produtos" className="hover:text-foreground">
          Produtos
        </Link>
        {product.category ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/categorias/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <ProductDetail product={product} />
    </div>
  )
}
