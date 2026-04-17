import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PROTECTED_PREFIXES = ["/conta", "/admin", "/checkout"]

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!isProtected) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: getUser() revalida o token com o servidor do Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`
    loginUrl.pathname = "/entrar"
    loginUrl.searchParams.set("next", next)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
