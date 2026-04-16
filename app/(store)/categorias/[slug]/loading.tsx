import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton"

export default function CategoriaLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <ProductGridSkeleton />
    </div>
  )
}
