import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Callback chamado pelos emails do Supabase (confirmação de cadastro e reset
 * de senha). Troca o `code` por uma sessão e redireciona para `next`.
 *
 * Quando `signout=1` for passado, encerramos a sessão logo após a troca —
 * usado no fluxo de confirmação de cadastro, onde queremos que o usuário
 * faça login manualmente.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/conta"
  const shouldSignOut = searchParams.get("signout") === "1"

  if (!code) {
    return NextResponse.redirect(
      `${origin}/entrar?error=${encodeURIComponent(
        "Link inválido. Solicite um novo email.",
      )}`,
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/entrar?error=${encodeURIComponent(
        "Link expirado ou inválido. Solicite um novo email.",
      )}`,
    )
  }

  if (shouldSignOut) {
    await supabase.auth.signOut()
  }

  const safeNext = next.startsWith("/") ? next : "/conta"
  return NextResponse.redirect(`${origin}${safeNext}`)
}
