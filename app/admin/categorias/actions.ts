"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireCurrentUserAdmin } from "@/lib/auth/admin"

export type ActionResult = { success: boolean; error?: string }

const categorySchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z.string().min(2, "Slug é obrigatório"),
  description: z.string().optional().default(""),
  image_url: z.string().optional().default(""),
})

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()
    const raw = Object.fromEntries(formData)
    const parsed = categorySchema.safeParse(raw)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
    }

    const data = parsed.data
    const { error } = await supabase.from("categories").insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url || null,
    })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Já existe uma categoria com esse slug" }
      }
      return { success: false, error: "Erro ao criar categoria" }
    }

    revalidatePath("/admin/categorias")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()
    const raw = Object.fromEntries(formData)
    const parsed = categorySchema.safeParse(raw)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
    }

    const data = parsed.data
    const { error } = await supabase
      .from("categories")
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
      })
      .eq("id", categoryId)

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Já existe uma categoria com esse slug" }
      }
      return { success: false, error: "Erro ao atualizar categoria" }
    }

    revalidatePath("/admin/categorias")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)

    if (error) {
      return { success: false, error: "Erro ao remover categoria. Verifique se não há produtos vinculados." }
    }

    revalidatePath("/admin/categorias")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}
