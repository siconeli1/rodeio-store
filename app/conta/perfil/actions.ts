"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  phone: z.string().min(10, "Telefone inválido").or(z.literal("")),
})

export type ProfileActionResult = {
  success: boolean
  error?: string
}

export async function updateProfile(
  formData: FormData,
): Promise<ProfileActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Não autenticado" }

    const raw = Object.fromEntries(formData)
    const parsed = profileSchema.safeParse(raw)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos"
      return { success: false, error: firstError }
    }

    const { full_name, phone } = parsed.data

    const { error } = await supabase
      .from("profiles")
      .update({ full_name, phone: phone || null })
      .eq("id", user.id)

    if (error) return { success: false, error: "Erro ao salvar perfil" }

    revalidatePath("/conta")
    revalidatePath("/conta/perfil")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}
