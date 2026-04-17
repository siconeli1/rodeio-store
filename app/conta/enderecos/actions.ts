"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { savedAddressSchema } from "@/lib/address-schema"

export type ActionResult = {
  success: boolean
  error?: string
}

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createAddress(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()
    if (!user) return { success: false, error: "Não autenticado" }

    const raw = Object.fromEntries(formData)
    const parsed = savedAddressSchema.safeParse({
      ...raw,
      is_default: raw.is_default === "on",
    })

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos"
      return { success: false, error: firstError }
    }

    const data = parsed.data

    // Se marcou como padrão, desmarcar os outros
    if (data.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
    }

    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      ...data,
      complement: data.complement || null,
    })

    if (error) return { success: false, error: "Erro ao salvar endereço" }

    revalidatePath("/conta/enderecos")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function updateAddress(
  addressId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()
    if (!user) return { success: false, error: "Não autenticado" }

    const raw = Object.fromEntries(formData)
    const parsed = savedAddressSchema.safeParse({
      ...raw,
      is_default: raw.is_default === "on",
    })

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos"
      return { success: false, error: firstError }
    }

    const data = parsed.data

    // Se marcou como padrão, desmarcar os outros
    if (data.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", addressId)
    }

    const { error } = await supabase
      .from("addresses")
      .update({ ...data, complement: data.complement || null })
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (error) return { success: false, error: "Erro ao atualizar endereço" }

    revalidatePath("/conta/enderecos")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function deleteAddress(
  addressId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()
    if (!user) return { success: false, error: "Não autenticado" }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (error) return { success: false, error: "Erro ao remover endereço" }

    revalidatePath("/conta/enderecos")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}

export async function setDefaultAddress(
  addressId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()
    if (!user) return { success: false, error: "Não autenticado" }

    // Desmarcar todos
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)

    // Marcar o escolhido
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (error)
      return { success: false, error: "Erro ao definir endereço padrão" }

    revalidatePath("/conta/enderecos")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}
