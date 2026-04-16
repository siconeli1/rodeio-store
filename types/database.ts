export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  category_id: string | null
  images: string[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  color: string
  color_hex: string | null
  stock: number
  sku: string | null
  created_at: string
}

export interface ProductWithCategory extends Product {
  category: Category | null
}

export interface ProductWithVariants extends Product {
  category: Category | null
  product_variants: ProductVariant[]
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export interface AddressSnapshot {
  full_name: string
  phone: string
  zip_code: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
}

export interface Order {
  id: string
  user_id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: "pix" | "credit_card"
  payment_status: "pending" | "paid" | "failed"
  payment_id: string | null
  pix_qr_code: string | null
  pix_qr_code_base64: string | null
  pix_expires_at: string | null
  subtotal: number
  shipping_cost: number
  total: number
  address_snapshot: AddressSnapshot
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  product_image: string | null
  size: string
  color: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}
