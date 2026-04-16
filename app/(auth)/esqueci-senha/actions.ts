"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAppUrl } from "@/lib/url"

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()

  if (!email) {
    redirect(
      `/esqueci-senha?error=${encodeURIComponent("Informe seu email.")}`,
    )
  }

  const supabase = await createClient()

  // O link do email leva ao callback, que troca o `code` por sessão e
  // redireciona para /redefinir-senha, onde o usuário define a nova senha.
  const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent(
    "/redefinir-senha",
  )}`

  await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  // Não revelamos se o email existe — evita enumeração de usuários.
  redirect(`/esqueci-senha/enviado?email=${encodeURIComponent(email)}`)
}
