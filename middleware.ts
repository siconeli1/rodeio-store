import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas exceto:
     * - _next/static (assets)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos públicos com extensão
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
