import { Skeleton } from "@/components/ui/skeleton"

export default function ProdutosAdminLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <Skeleton className="h-9 max-w-sm rounded-md" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
