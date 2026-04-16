"use client"

import type { UseFormReturn } from "react-hook-form"
import { CreditCard, QrCode } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { CheckoutFormValues } from "./checkout-form"

interface PaymentFormProps {
  form: UseFormReturn<CheckoutFormValues>
}

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

export function PaymentForm({ form }: PaymentFormProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const method = watch("payment.method")
  const total = watch("total")

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pagamento</h2>

      <RadioGroup
        value={method}
        onValueChange={(val) => {
          setValue("payment.method", val as "pix" | "credit_card", {
            shouldValidate: true,
          })
        }}
        className="grid grid-cols-2 gap-3"
      >
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
            method === "pix"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50",
          )}
        >
          <RadioGroupItem value="pix" id="pix" />
          <QrCode className="size-5" />
          <div>
            <p className="text-sm font-medium">PIX</p>
            <p className="text-xs text-muted-foreground">Aprovação imediata</p>
          </div>
        </label>

        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
            method === "credit_card"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50",
          )}
        >
          <RadioGroupItem value="credit_card" id="credit_card" />
          <CreditCard className="size-5" />
          <div>
            <p className="text-sm font-medium">Cartão de crédito</p>
            <p className="text-xs text-muted-foreground">Até 12x</p>
          </div>
        </label>
      </RadioGroup>

      {/* CPF — comum aos dois métodos */}
      <div className="space-y-1.5">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          placeholder="00000000000"
          maxLength={11}
          {...register("payment.cpf")}
        />
        {errors.payment?.cpf && (
          <p className="text-xs text-destructive">{errors.payment.cpf.message}</p>
        )}
      </div>

      {method === "credit_card" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cardNumber">Número do cartão</Label>
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              {...register("payment.cardNumber")}
            />
            {errors.payment && "cardNumber" in errors.payment && (
              <p className="text-xs text-destructive">
                {(errors.payment as Record<string, { message?: string }>).cardNumber?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cardholderName">Nome no cartão</Label>
            <Input
              id="cardholderName"
              placeholder="JOÃO DA SILVA"
              {...register("payment.cardholderName")}
            />
            {errors.payment && "cardholderName" in errors.payment && (
              <p className="text-xs text-destructive">
                {(errors.payment as Record<string, { message?: string }>).cardholderName?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expirationMonth">Mês</Label>
            <select
              id="expirationMonth"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("payment.expirationMonth")}
            >
              <option value="">Mês</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, "0")
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expirationYear">Ano</Label>
            <select
              id="expirationYear"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("payment.expirationYear")}
            >
              <option value="">Ano</option>
              {Array.from({ length: 10 }, (_, i) => {
                const y = String(new Date().getFullYear() + i)
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="securityCode">CVV</Label>
            <Input
              id="securityCode"
              placeholder="123"
              maxLength={4}
              {...register("payment.securityCode")}
            />
            {errors.payment && "securityCode" in errors.payment && (
              <p className="text-xs text-destructive">
                {(errors.payment as Record<string, { message?: string }>).securityCode?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="installments">Parcelas</Label>
            <select
              id="installments"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("payment.installments", { valueAsNumber: true })}
            >
              {INSTALLMENT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}x de{" "}
                  {(total / n).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
