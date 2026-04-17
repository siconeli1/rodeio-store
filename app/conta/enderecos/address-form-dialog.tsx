"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Address } from "@/types/database"
import { createAddress, updateAddress } from "./actions"

interface AddressFormDialogProps {
  trigger: React.ReactNode
  address?: Address
}

export function AddressFormDialog({ trigger, address }: AddressFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = address
        ? await updateAddress(address.id, formData)
        : await createAddress(formData)

      if (result.success) {
        toast.success(
          address ? "Endereço atualizado!" : "Endereço adicionado!",
        )
        setOpen(false)
      } else {
        toast.error(result.error ?? "Erro ao salvar endereço")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {address ? "Editar endereço" : "Novo endereço"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="label">Nome do endereço</Label>
            <Input
              id="label"
              name="label"
              placeholder="Ex: Casa, Trabalho"
              defaultValue={address?.label ?? ""}
              required
            />
          </div>

          {/* Nome completo */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={address?.full_name ?? ""}
              required
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(11) 99999-9999"
              defaultValue={address?.phone ?? ""}
              required
            />
          </div>

          {/* CEP e Estado lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                name="zip_code"
                maxLength={8}
                placeholder="00000000"
                defaultValue={address?.zip_code ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input
                id="state"
                name="state"
                maxLength={2}
                placeholder="SP"
                defaultValue={address?.state ?? ""}
                required
              />
            </div>
          </div>

          {/* Rua */}
          <div className="space-y-1.5">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              name="street"
              defaultValue={address?.street ?? ""}
              required
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                name="number"
                defaultValue={address?.number ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                name="complement"
                placeholder="Apto, bloco..."
                defaultValue={address?.complement ?? ""}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={address?.neighborhood ?? ""}
              required
            />
          </div>

          {/* Cidade */}
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              defaultValue={address?.city ?? ""}
              required
            />
          </div>

          {/* Padrão */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              defaultChecked={address?.is_default ?? false}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="is_default" className="text-sm font-normal">
              Definir como endereço padrão
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
