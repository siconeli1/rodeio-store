"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "/conta")

  if (!email || !password) {
    redirect(`/entrar?error=${encodeURIComponent("Informe email e senha.")}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : "Não foi possível entrar. Tente novamente."
    redirect(`/entrar?error=${encodeURIComponent(message)}`)
  }

  revalidatePath("/", "layout")
  redirect(next.startsWith("/") ? next : "/conta")
}
