"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteAddress, setDefaultAddress } from "./actions"

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Tem certeza que deseja remover este endereço?")) return
    startTransition(async () => {
      const result = await deleteAddress(addressId)
      if (result.success) {
        toast.success("Endereço removido")
      } else {
        toast.error(result.error ?? "Erro ao remover")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="mr-1 size-4" />
      Remover
    </Button>
  )
}

export function SetDefaultButton({
  addressId,
  isDefault,
}: {
  addressId: string
  isDefault: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddress(addressId)
      if (result.success) {
        toast.success("Endereço padrão definido")
      } else {
        toast.error(result.error ?? "Erro ao definir padrão")
      }
    })
  }

  if (isDefault) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <Star className="size-3 fill-current" />
        Padrão
      </span>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSetDefault}
      disabled={isPending}
    >
      <Star className="mr-1 size-4" />
      Tornar padrão
    </Button>
  )
}
