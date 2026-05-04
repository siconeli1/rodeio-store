import { createClient } from "./server"
import type {
  Address,
  Category,
  OrderWithItems,
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
    .select(
      "*, category:categories(*), product_variants(*), product_color_images(*)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  return data as ProductWithVariants | null
}

// ---------------------------------------------------------------------------
// Tamanhos disponíveis (para filtro global)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pedidos do usuário
// ---------------------------------------------------------------------------

export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as OrderWithItems[]
}

export async function getUserOrderById(
  userId: string,
  orderId: string,
): Promise<OrderWithItems | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle()

  return data as unknown as OrderWithItems | null
}

// ---------------------------------------------------------------------------
// Endereços do usuário
// ---------------------------------------------------------------------------

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  return (data ?? []) as Address[]
}

// ---------------------------------------------------------------------------
// Perfil do usuário
// ---------------------------------------------------------------------------

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, is_admin")
    .eq("id", userId)
    .maybeSingle()

  return data
}

// ---------------------------------------------------------------------------
// Tamanhos disponíveis
// ---------------------------------------------------------------------------

export async function getAvailableSizes(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("product_variants")
    .select("size")
    .gt("stock", 0)

  return sortSizes([...new Set((data ?? []).map((v) => v.size))])
}

export async function getSizesByCategorySlug(
  slug: string,
): Promise<string[]> {
  const supabase = await createClient()

  const category = await getCategoryBySlug(slug)
  if (!category) return []

  // Produtos ativos da categoria
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("is_active", true)
    .eq("category_id", category.id)

  const productIds = (products ?? []).map((p) => p.id)
  if (productIds.length === 0) return []

  const { data: variants } = await supabase
    .from("product_variants")
    .select("size")
    .gt("stock", 0)
    .in("product_id", productIds)

  return sortSizes([...new Set((variants ?? []).map((v) => v.size))])
}

// Ordena tamanhos: numéricos primeiro (asc), depois letras na ordem PP→XG, depois o restante
function sortSizes(sizes: string[]): string[] {
  const order = ["PP", "P", "M", "G", "GG", "XG", "Único"]
  return sizes.sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)
    const aIsNum = !Number.isNaN(aNum)
    const bIsNum = !Number.isNaN(bNum)
    if (aIsNum && bIsNum) return aNum - bNum
    if (aIsNum) return -1
    if (bIsNum) return 1
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}
