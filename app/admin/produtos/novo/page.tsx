import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "../product-form"
import type { Category } from "@/types/database"

export const metadata = {
  title: "Novo produto — Admin RodeioStore",
}

export default async function NovoProdutoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  const categories = (data ?? []) as Category[]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Novo produto
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados para criar um novo produto.
        </p>
      </header>

      <ProductForm categories={categories} />
    </div>
  )
}
