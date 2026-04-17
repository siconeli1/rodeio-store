"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireCurrentUserAdmin } from "@/lib/auth/admin"

export type ActionResult = { success: boolean; error?: string; id?: string }

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1, "Tamanho é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  color_hex: z.string().optional().default(""),
  stock: z.number().int().min(0),
  sku: z.string().optional().default(""),
})

const colorImagesSchema = z.object({
  color: z.string().min(1),
  images: z.array(z.string()).max(5, "No máximo 5 imagens por cor"),
})

const productSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z.string().min(2, "Slug é obrigatório"),
  description: z.string().optional().default(""),
  price: z.number().positive("Preço deve ser maior que zero"),
  compare_price: z.number().min(0).optional(),
  category_id: z.string().optional(),
  images: z.array(z.string()),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  variants: z.array(variantSchema),
  color_images: z.array(colorImagesSchema).default([]),
})

export type ProductInput = z.infer<typeof productSchema>

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
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
    }

    const { variants, color_images, ...productData } = parsed.data

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        description: productData.description || null,
        compare_price: productData.compare_price || null,
        category_id: productData.category_id || null,
      })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Já existe um produto com esse slug" }
      }
      return { success: false, error: "Erro ao criar produto" }
    }

    // Inserir variantes
    if (variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: product.id,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex || null,
        stock: v.stock,
        sku: v.sku || null,
      }))
      await supabase.from("product_variants").insert(variantRows)
    }

    // Inserir imagens por cor (apenas cores que têm pelo menos uma imagem)
    const colorImageRows = color_images
      .filter((c) => c.images.length > 0)
      .map((c) => ({
        product_id: product.id,
        color: c.color,
        images: c.images,
      }))
    if (colorImageRows.length > 0) {
      await supabase.from("product_color_images").insert(colorImageRows)
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
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
    }

    const { variants, color_images, ...productData } = parsed.data

    const { error } = await supabase
      .from("products")
      .update({
        ...productData,
        description: productData.description || null,
        compare_price: productData.compare_price || null,
        category_id: productData.category_id || null,
      })
      .eq("id", productId)

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Já existe um produto com esse slug" }
      }
      return { success: false, error: "Erro ao atualizar produto" }
    }

    // Deletar variantes existentes e reinserir (simplifica a lógica de diff)
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)

    if (variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: productId,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex || null,
        stock: v.stock,
        sku: v.sku || null,
      }))
      await supabase.from("product_variants").insert(variantRows)
    }

    // Substituir imagens por cor
    await supabase
      .from("product_color_images")
      .delete()
      .eq("product_id", productId)

    const colorImageRows = color_images
      .filter((c) => c.images.length > 0)
      .map((c) => ({
        product_id: productId,
        color: c.color,
        images: c.images,
      }))
    if (colorImageRows.length > 0) {
      await supabase.from("product_color_images").insert(colorImageRows)
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

    // Deletar variantes primeiro
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

    const { error } = await supabase.storage
      .from("images")
      .upload(path, file, {
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
    const message = err instanceof Error ? err.message : "Erro inesperado no upload"
    return { error: message }
  }
}
