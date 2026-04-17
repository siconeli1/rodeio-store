import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "../product-form"
import { DeleteProductButton } from "./delete-product-button"
import type { Category, ProductWithVariants } from "@/types/database"

export const metadata = {
  title: "Editar produto — Admin RodeioStore",
}

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, category:categories(*), product_variants(*), product_color_images(*)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("*").order("name"),
  ])

  if (!productRes.data) redirect("/admin/produtos")

  const product = productRes.data as unknown as ProductWithVariants
  const categories = (categoriesRes.data ?? []) as Category[]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Editar produto
          </h1>
          <p className="text-sm text-muted-foreground">
            {product.name}
          </p>
        </div>
        <DeleteProductButton productId={product.id} />
      </header>

      <ProductForm categories={categories} product={product} />
    </div>
  )
}
