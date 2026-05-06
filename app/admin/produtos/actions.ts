"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireCurrentUserAdmin } from "@/lib/auth/admin"
import {
  DEFAULT_VARIANT_COLOR,
  DEFAULT_VARIANT_SIZE,
} from "@/lib/product-options"

export type ActionResult = { success: boolean; error?: string; id?: string }

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional().default(""),
  color: z.string().optional().default(""),
  color_hex: z.string().optional().default(""),
  stock: z.number().int().min(0),
  sku: z.string().optional().default(""),
})

const colorImagesSchema = z.object({
  color: z.string().min(1),
  images: z.array(z.string()).max(5, "No maximo 5 imagens por cor"),
})

const productSchema = z.object({
  name: z.string().min(2, "Nome e obrigatorio"),
  slug: z.string().min(2, "Slug e obrigatorio"),
  description: z.string().optional().default(""),
  price: z.number().positive("Preco deve ser maior que zero"),
  compare_price: z.number().min(0).optional(),
  category_id: z.string().optional(),
  images: z.array(z.string()),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  variants: z.array(variantSchema),
  color_images: z.array(colorImagesSchema).default([]),
})

export type ProductInput = z.infer<typeof productSchema>

function normalizeVariants(variants: ProductInput["variants"]) {
  return variants
    .filter(
      (v) =>
        v.size.trim() ||
        v.color.trim() ||
        v.color_hex.trim() ||
        v.sku.trim() ||
        v.stock > 0,
    )
    .map((v) => ({
      ...v,
      size: v.size.trim() || DEFAULT_VARIANT_SIZE,
      color: v.color.trim() || DEFAULT_VARIANT_COLOR,
      color_hex: v.color_hex.trim(),
      sku: v.sku.trim(),
    }))
}

function variantsRequiredError(): ActionResult {
  return {
    success: false,
    error: "Informe o estoque do produto antes de salvar",
  }
}

function productRows(input: Omit<ProductInput, "variants" | "color_images">) {
  return {
    ...input,
    description: input.description || null,
    compare_price: input.compare_price || null,
    category_id: input.category_id || null,
  }
}

function variantRows(
  productId: string,
  variants: ReturnType<typeof normalizeVariants>,
) {
  return variants.map((v) => ({
    product_id: productId,
    size: v.size,
    color: v.color,
    color_hex: v.color_hex || null,
    stock: v.stock,
    sku: v.sku || null,
  }))
}

function colorImageRows(productId: string, colorImages: ProductInput["color_images"]) {
  return colorImages
    .filter((c) => c.images.length > 0)
    .map((c) => ({
      product_id: productId,
      color: c.color,
      images: c.images,
    }))
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()
    const parsed = productSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados invalidos",
      }
    }

    const { variants, color_images, ...productData } = parsed.data
    const normalizedVariants = normalizeVariants(variants)
    if (normalizedVariants.length === 0) return variantsRequiredError()

    const { data: product, error } = await supabase
      .from("products")
      .insert(productRows(productData))
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ja existe um produto com esse slug" }
      }
      return { success: false, error: "Erro ao criar produto" }
    }

    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variantRows(product.id, normalizedVariants))
    if (variantsError) {
      return { success: false, error: "Erro ao salvar estoque do produto" }
    }

    const imagesByColor = colorImageRows(product.id, color_images)
    if (imagesByColor.length > 0) {
      await supabase.from("product_color_images").insert(imagesByColor)
    }

    revalidatePath("/admin/produtos")
    return { success: true, id: product.id }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()
    const parsed = productSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados invalidos",
      }
    }

    const { variants, color_images, ...productData } = parsed.data
    const normalizedVariants = normalizeVariants(variants)
    if (normalizedVariants.length === 0) return variantsRequiredError()

    const { error } = await supabase
      .from("products")
      .update(productRows(productData))
      .eq("id", productId)

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ja existe um produto com esse slug" }
      }
      return { success: false, error: "Erro ao atualizar produto" }
    }

    await supabase.from("product_variants").delete().eq("product_id", productId)
    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variantRows(productId, normalizedVariants))
    if (variantsError) {
      return { success: false, error: "Erro ao salvar estoque do produto" }
    }

    await supabase
      .from("product_color_images")
      .delete()
      .eq("product_id", productId)

    const imagesByColor = colorImageRows(productId, color_images)
    if (imagesByColor.length > 0) {
      await supabase.from("product_color_images").insert(imagesByColor)
    }

    revalidatePath("/admin/produtos")
    revalidatePath(`/admin/produtos/${productId}`)
    return { success: true, id: productId }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function deleteProduct(
  productId: string,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()

    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (error) {
      return { success: false, error: "Erro ao remover produto" }
    }

    revalidatePath("/admin/produtos")
    redirect("/admin/produtos")
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function uploadProductImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { error: "Acesso negado" }
    }

    const supabase = await createClient()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: "Nenhum arquivo selecionado" }
    }

    const nameParts = file.name.split(".")
    const ext = nameParts.length > 1 ? nameParts.pop() : "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `products/${fileName}`

    const { error } = await supabase.storage.from("images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    })

    if (error) {
      console.error("[uploadProductImage] Supabase storage error:", error)
      return { error: `Erro no upload: ${error.message}` }
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(path)

    return { url: urlData.publicUrl }
  } catch (err) {
    console.error("[uploadProductImage] Unexpected error:", err)
    const message =
      err instanceof Error ? err.message : "Erro inesperado no upload"
    return { error: message }
  }
}
