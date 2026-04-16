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
