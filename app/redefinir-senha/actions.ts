"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (password.length < 6) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent(
        "A senha precisa ter ao menos 6 caracteres.",
      )}`,
    )
  }

  if (password !== confirm) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent("As senhas não coincidem.")}`,
    )
  }

  const supabase = await createClient()

  // O usuário só chega aqui com sessão válida criada pelo callback do email.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/esqueci-senha?error=${encodeURIComponent(
        "Sessão de recuperação expirada. Solicite um novo link.",
      )}`,
    )
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent(
        "Não foi possível atualizar a senha. Tente novamente.",
      )}`,
    )
  }

  // Encerra a sessão de recuperação e força o usuário a logar com a senha nova.
  await supabase.auth.signOut()
  revalidatePath("/", "layout")

  redirect(
    `/entrar?success=${encodeURIComponent(
      "Senha redefinida! Entre com a nova senha.",
    )}`,
  )
}
