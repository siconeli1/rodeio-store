"use client"

import { useCallback } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CheckoutFormValues } from "./checkout-form"

interface AddressFormProps {
  form: UseFormReturn<CheckoutFormValues>
}

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

export function AddressForm({ form }: AddressFormProps) {
  const { register, setValue, formState: { errors } } = form

  const handleCepBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      const cep = e.target.value.replace(/\D/g, "")
      if (cep.length !== 8) return

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (data.erro) return

        if (data.logradouro) setValue("address.street", data.logradouro, { shouldValidate: true })
        if (data.bairro) setValue("address.neighborhood", data.bairro, { shouldValidate: true })
        if (data.localidade) setValue("address.city", data.localidade, { shouldValidate: true })
        if (data.uf) setValue("address.state", data.uf, { shouldValidate: true })
      } catch {
        // Silenciar erro de rede — o usuário pode preencher manualmente
      }
    },
    [setValue],
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endereço de entrega</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input
            id="full_name"
            placeholder="João da Silva"
            {...register("address.full_name")}
          />
          {errors.address?.full_name && (
            <p className="text-xs text-destructive">{errors.address.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="11999999999"
            {...register("address.phone")}
          />
          {errors.address?.phone && (
            <p className="text-xs text-destructive">{errors.address.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            placeholder="01001000"
            maxLength={8}
            {...register("address.zip_code")}
            onBlur={(e) => {
              register("address.zip_code").onBlur(e)
              handleCepBlur(e)
            }}
          />
          {errors.address?.zip_code && (
            <p className="text-xs text-destructive">{errors.address.zip_code.message}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            placeholder="Rua das Flores"
            {...register("address.street")}
          />
          {errors.address?.street && (
            <p className="text-xs text-destructive">{errors.address.street.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            placeholder="123"
            {...register("address.number")}
          />
          {errors.address?.number && (
            <p className="text-xs text-destructive">{errors.address.number.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            placeholder="Apto 4B (opcional)"
            {...register("address.complement")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            placeholder="Centro"
            {...register("address.neighborhood")}
          />
          {errors.address?.neighborhood && (
            <p className="text-xs text-destructive">{errors.address.neighborhood.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="São Paulo"
            {...register("address.city")}
          />
          {errors.address?.city && (
            <p className="text-xs text-destructive">{errors.address.city.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">Estado</Label>
          <select
            id="state"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register("address.state")}
          >
            <option value="">Selecione</option>
            {STATES.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
          {errors.address?.state && (
            <p className="text-xs text-destructive">{errors.address.state.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
