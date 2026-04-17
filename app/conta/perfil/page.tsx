import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/queries"
import { Card } from "@/components/ui/card"
import { ProfileForm } from "./profile-form"

export const metadata = {
  title: "Meu perfil — RodeioStore",
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?next=/conta/perfil")

  const profile = await getUserProfile(user.id)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Meu perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Atualize seus dados pessoais.
        </p>
      </header>

      <Card className="max-w-md p-6">
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          email={user.email ?? ""}
          phone={profile?.phone ?? ""}
        />
      </Card>
    </div>
  )
}
