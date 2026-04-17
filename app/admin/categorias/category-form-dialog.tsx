"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Category } from "@/types/database"
import { createCategory, updateCategory } from "./actions"

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

interface CategoryFormDialogProps {
  trigger: React.ReactNode
  category?: Category
}

export function CategoryFormDialog({
  trigger,
  category,
}: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [slug, setSlug] = useState(category?.slug ?? "")

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!category) {
      setSlug(toSlug(e.target.value))
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, formData)
        : await createCategory(formData)

      if (result.success) {
        toast.success(
          category ? "Categoria atualizada!" : "Categoria criada!",
        )
        setOpen(false)
        setSlug("")
      } else {
        toast.error(result.error ?? "Erro ao salvar")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name ?? ""}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Usado na URL: /categorias/{slug || "..."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={category?.description ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image_url">URL da imagem</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://..."
              defaultValue={category?.image_url ?? ""}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
