import { createClient } from "./server"
import type {
  Category,
  ProductWithCategory,
  ProductWithVariants,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (data ?? []) as Category[]
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  return data as Category | null
}

// ---------------------------------------------------------------------------
// Produtos — listagem
// ---------------------------------------------------------------------------

export type ProductSort = "newest" | "price-asc" | "price-desc"

interface GetProductsOptions {
  categorySlug?: string
  size?: string
  sort?: ProductSort
  limit?: number
}

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<ProductWithCategory[]> {
  const { categorySlug, size, sort = "newest", limit } = options
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug)
    if (category) {
      query = query.eq("category_id", category.id)
    } else {
      return []
    }
  }

  if (size) {
    // Subquery: só retorna produtos que tenham uma variante com esse tamanho e estoque > 0
    const { data: variantProductIds } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("size", size)
      .gt("stock", 0)

    const ids = [...new Set((variantProductIds ?? []).map((v) => v.product_id))]
    if (ids.length === 0) return []
    query = query.in("id", ids)
  }

  switch (sort) {
    case "price-asc":
      query = query.order("price", { ascending: true })
      break
    case "price-desc":
      query = query.order("price", { ascending: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data } = await query
  return (data ?? []) as ProductWithCategory[]
}

// ---------------------------------------------------------------------------
// Produtos — destaque
// ---------------------------------------------------------------------------

export async function getFeaturedProducts(
  limit = 8,
): Promise<ProductWithCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as ProductWithCategory[]
}

// ---------------------------------------------------------------------------
// Produto — detalhe por slug (com variantes)
// ---------------------------------------------------------------------------

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithVariants | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  return data as ProductWithVariants | null
}

// ---------------------------------------------------------------------------
// Tamanhos disponíveis (para filtro global)
// ---------------------------------------------------------------------------

export async function getAvailableSizes(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("product_variants")
    .select("size")
    .gt("stock", 0)

  const unique = [...new Set((data ?? []).map((v) => v.size))]
  const order = ["PP", "P", "M", "G", "GG", "XG", "Único"]
  return unique.sort(
    (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
              (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
  )
}
