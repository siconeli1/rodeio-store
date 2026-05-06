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

export interface ProductColorImages {
  id: string
  product_id: string
  color: string
  images: string[]
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  category: Category | null
}

export interface ProductWithVariants extends Product {
  category: Category | null
  product_variants: ProductVariant[]
  product_color_images: ProductColorImages[]
}

// ---------------------------------------------------------------------------
// Endereços
// ---------------------------------------------------------------------------

export interface Address {
  id: string
  user_id: string
  label: string
  full_name: string
  phone: string
  zip_code: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  is_default: boolean
  created_at: string
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
  checkout_attempt_id: string | null
  external_reference: string | null
  mp_status: string | null
  mp_status_detail: string | null
  payment_failure_reason: string | null
  pix_qr_code: string | null
  pix_qr_code_base64: string | null
  pix_expires_at: string | null
  paid_at: string | null
  failed_at: string | null
  stock_confirmed_at: string | null
  stock_released_at: string | null
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
