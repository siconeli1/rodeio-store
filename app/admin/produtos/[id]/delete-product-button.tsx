"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteProduct } from "../actions"

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Tem certeza que deseja remover este produto e todas as suas variantes?")) return
    startTransition(async () => {
      const result = await deleteProduct(productId)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao remover")
      }
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="mr-1 size-4" />
      {isPending ? "Removendo..." : "Excluir produto"}
    </Button>
  )
}
