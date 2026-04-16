import { ProductCard } from "./product-card"
import type { ProductWithCategory } from "@/types/database"

interface ProductGridProps {
  products: ProductWithCategory[]
  emptyMessage?: string
}

export function ProductGrid({
  products,
  emptyMessage = "Nenhum produto encontrado.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
