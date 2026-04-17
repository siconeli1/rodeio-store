import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

type AdminReason =
  | "unauthenticated"
  | "profile"
  | "allowlist"
  | "bootstrap"
  | "missing-role"

export interface AdminAccessResult {
  user: User | null
  isAdmin: boolean
  reason: AdminReason
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function getAdminAllowlist(): Set<string> {
  const raw = `${process.env.ADMIN_EMAILS ?? ""},${process.env.ADMIN_EMAIL ?? ""}`
  return new Set(
    raw
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter((entry): entry is string => Boolean(entry)),
  )
}

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function promoteUserToAdmin(user: User): Promise<boolean> {
  const supabaseAdmin = createSupabaseAdminClient()
  if (!supabaseAdmin) return false

  const payload: {
    id: string
    is_admin: boolean
    updated_at: string
    full_name?: string
  } = {
    id: user.id,
    is_admin: true,
    updated_at: new Date().toISOString(),
  }

  if (typeof user.user_metadata?.full_name === "string") {
    payload.full_name = user.user_metadata.full_name
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(payload, { onConflict: "id" })

  if (error) {
    console.error("[admin-access] Nao foi possivel promover usuario a admin:", error.message)
    return false
  }

  return true
}

async function shouldBootstrapFirstAdmin(): Promise<boolean> {
  if (process.env.ADMIN_AUTO_BOOTSTRAP === "false") return false

  const supabaseAdmin = createSupabaseAdminClient()
  if (!supabaseAdmin) return false

  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true)

  if (error) {
    console.error("[admin-access] Falha ao verificar admins existentes:", error.message)
    return false
  }

  return (count ?? 0) === 0
}

export async function getCurrentUserAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, isAdmin: false, reason: "unauthenticated" }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[admin-access] Falha ao ler perfil:", error.message)
  }

  if (profile?.is_admin) {
    return { user, isAdmin: true, reason: "profile" }
  }

  const allowlist = getAdminAllowlist()
  const email = normalizeEmail(user.email)

  if (email && allowlist.has(email)) {
    const promoted = await promoteUserToAdmin(user)
    if (promoted) {
      return { user, isAdmin: true, reason: "allowlist" }
    }
  }

  // Se uma allowlist foi configurada, bloqueamos bootstrap aberto.
  if (allowlist.size > 0) {
    return { user, isAdmin: false, reason: "missing-role" }
  }

  if (await shouldBootstrapFirstAdmin()) {
    const promoted = await promoteUserToAdmin(user)
    if (promoted) {
      return { user, isAdmin: true, reason: "bootstrap" }
    }
  }

  return { user, isAdmin: false, reason: "missing-role" }
}

export async function requireCurrentUserAdmin(): Promise<boolean> {
  const access = await getCurrentUserAdminAccess()
  return Boolean(access.user && access.isAdmin)
}
