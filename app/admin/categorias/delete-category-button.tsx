"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCategory } from "./actions"

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Tem certeza que deseja remover esta categoria?")) return
    startTransition(async () => {
      const result = await deleteCategory(categoryId)
      if (result.success) {
        toast.success("Categoria removida")
      } else {
        toast.error(result.error ?? "Erro ao remover")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
