import { Skeleton } from "@/components/ui/skeleton"

export default function ProdutoLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-9 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-12 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
