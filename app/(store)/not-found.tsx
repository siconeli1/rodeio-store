import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Search className="size-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Página não encontrada</h2>
      <p className="text-sm text-muted-foreground">
        O produto ou categoria que você procura não existe ou foi removido.
      </p>
      <Button asChild>
        <Link href="/produtos">Ver todos os produtos</Link>
      </Button>
    </div>
  )
}
