import { Skeleton } from "@/components/ui/skeleton"

export default function PedidosAdminLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
