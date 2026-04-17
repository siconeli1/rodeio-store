"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireCurrentUserAdmin } from "@/lib/auth/admin"

export type ActionResult = { success: boolean; error?: string }

const VALID_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  try {
    if (!(await requireCurrentUserAdmin())) {
      return { success: false, error: "Acesso negado" }
    }

    if (!VALID_STATUSES.includes(status)) {
      return { success: false, error: "Status inválido" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) return { success: false, error: "Erro ao atualizar status" }

    revalidatePath("/admin/pedidos")
    return { success: true }
  } catch {
    return { success: false, error: "Erro inesperado" }
  }
}
