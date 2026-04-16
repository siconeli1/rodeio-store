import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton"

export default function ProdutosLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-44" />
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="space-y-4 md:w-48 md:shrink-0">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  )
}
