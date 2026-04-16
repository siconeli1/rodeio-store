import { Suspense } from "react"
import type { Metadata } from "next"
import {
  getProducts,
  getCategories,
  getAvailableSizes,
  type ProductSort,
} from "@/lib/supabase/queries"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton"
import { ProductFilters } from "@/components/store/product-filters"
import { ProductSort as SortSelect } from "@/components/store/product-sort"

export const metadata: Metadata = {
  title: "Produtos — RodeioStore",
  description:
    "Explore nosso catálogo de moda country: camisas, botas, chapéus e muito mais.",
}

type SearchParams = Promise<{
  categoria?: string
  tamanho?: string
  ordem?: string
}>

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { categoria, tamanho, ordem } = await searchParams

  const sort = (["newest", "price-asc", "price-desc"].includes(ordem ?? "")
    ? ordem
    : "newest") as ProductSort

  const [products, categories, availableSizes] = await Promise.all([
    getProducts({ categorySlug: categoria, size: tamanho, sort }),
    getCategories(),
    getAvailableSizes(),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""}{" "}
            encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="md:w-48 md:shrink-0">
          <Suspense>
            <ProductFilters
              categories={categories}
              availableSizes={availableSizes}
            />
          </Suspense>
        </div>

        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={products} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
