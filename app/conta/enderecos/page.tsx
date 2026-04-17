import { redirect } from "next/navigation"
import { MapPin, Plus, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUserAddresses } from "@/lib/supabase/queries"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddressFormDialog } from "./address-form-dialog"
import { DeleteAddressButton, SetDefaultButton } from "./address-actions"

export const metadata = {
  title: "Meus endereços — RodeioStore",
}

export default async function EnderecosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?next=/conta/enderecos")

  const addresses = await getUserAddresses(user.id)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Meus endereços
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus endereços de entrega.
          </p>
        </div>
        <AddressFormDialog
          trigger={
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Novo endereço
            </Button>
          }
        />
      </header>

      {addresses.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <MapPin className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum endereço cadastrado ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{addr.label}</span>
                    <SetDefaultButton
                      addressId={addr.id}
                      isDefault={addr.is_default}
                    />
                  </div>
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {addr.full_name}
                    </p>
                    <p>
                      {addr.street}, {addr.number}
                      {addr.complement ? ` — ${addr.complement}` : ""}
                    </p>
                    <p>
                      {addr.neighborhood} — {addr.city}/{addr.state}
                    </p>
                    <p>CEP: {addr.zip_code}</p>
                    {addr.phone && <p>Tel: {addr.phone}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <AddressFormDialog
                    address={addr}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="mr-1 size-4" />
                        Editar
                      </Button>
                    }
                  />
                  <DeleteAddressButton addressId={addr.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
