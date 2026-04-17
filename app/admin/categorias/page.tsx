import { Plus, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoryFormDialog } from "./category-form-dialog"
import { DeleteCategoryButton } from "./delete-category-button"
import type { Category } from "@/types/database"

export const metadata = {
  title: "Categorias — Admin RodeioStore",
}

export default async function AdminCategoriasPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  const categories = (data ?? []) as Category[]

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Categorias
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias de produtos.
          </p>
        </div>
        <CategoryFormDialog
          trigger={
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Nova categoria
            </Button>
          }
        />
      </header>

      {categories.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Nenhuma categoria cadastrada.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">
                  Descrição
                </TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {cat.slug}
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground md:table-cell">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <CategoryFormDialog
                        category={cat}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <DeleteCategoryButton categoryId={cat.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
