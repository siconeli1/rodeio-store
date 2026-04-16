"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAppUrl } from "@/lib/url"

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!fullName || !email || !password) {
    redirect(
      `/cadastrar?error=${encodeURIComponent("Preencha todos os campos.")}`,
    )
  }

  if (password.length < 6) {
    redirect(
      `/cadastrar?error=${encodeURIComponent(
        "A senha precisa ter ao menos 6 caracteres.",
      )}`,
    )
  }

  const supabase = await createClient()

  // Após confirmar o email, o Supabase envia o usuário para /auth/callback com
  // um `code`. O callback troca pelo token de sessão e, com signout=1,
  // encerra a sessão recém-criada para que o usuário faça login manualmente.
  const emailRedirectTo = `${getAppUrl()}/auth/callback?signout=1&next=${encodeURIComponent(
    `/entrar?success=${encodeURIComponent("Email confirmado! Faça login para continuar.")}`,
  )}`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo,
    },
  })

  if (error) {
    const message = /registered|exists/i.test(error.message)
      ? "Este email já está cadastrado."
      : "Não foi possível criar sua conta. Tente novamente."
    redirect(`/cadastrar?error=${encodeURIComponent(message)}`)
  }

  // Quando o email já existe, o Supabase NÃO retorna erro (para evitar
  // enumeração de usuários). Em vez disso, devolve um `user` com `identities`
  // vazio. Detectamos esse caso e tratamos como duplicado.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    redirect(
      `/cadastrar?error=${encodeURIComponent("Este email já está cadastrado.")}`,
    )
  }

  // Se confirmação de email estiver desativada, o usuário já está logado.
  if (data.session) {
    revalidatePath("/", "layout")
    redirect("/conta")
  }

  redirect(`/cadastrar/confirme-email?email=${encodeURIComponent(email)}`)
}
