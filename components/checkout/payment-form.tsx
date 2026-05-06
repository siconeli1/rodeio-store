"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react"
import { CreditCard, QrCode } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { CheckoutFormValues } from "./checkout-form"

export interface CardPaymentBrickData {
  token: string
  issuer_id: string | number
  payment_method_id: string
  installments: number
  payer?: {
    identification?: {
      number?: string
    }
  }
}

interface PaymentFormProps {
  form: UseFormReturn<CheckoutFormValues>
  total: number
  onCardSubmit: (data: CardPaymentBrickData) => Promise<void>
}

const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

export function PaymentForm({
  form,
  total,
  onCardSubmit,
}: PaymentFormProps) {
  const [sdkReady, setSdkReady] = useState(false)
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const method = watch("payment.method")
  const cardInitialization = useMemo(() => ({ amount: total }), [total])
  const cardCustomization = useMemo(
    () => ({
      paymentMethods: {
        minInstallments: 1,
        maxInstallments: 12,
        types: { included: ["credit_card" as const] },
      },
      visual: { hideFormTitle: true },
    }),
    [],
  )
  const handleCardSubmit = useCallback(
    async (data: unknown) => {
      await onCardSubmit(data as CardPaymentBrickData)
    },
    [onCardSubmit],
  )
  const handleCardError = useCallback(() => {
    toast.error("Nao foi possivel carregar o formulario de cartao")
  }, [])

  useEffect(() => {
    if (!publicKey) return
    initMercadoPago(publicKey, {
      locale: "pt-BR",
      advancedFraudPrevention: true,
    })
    const readyTimer = window.setTimeout(() => setSdkReady(true), 0)
    return () => window.clearTimeout(readyTimer)
  }, [])

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
            <p className="text-xs text-muted-foreground">Aprovacao imediata</p>
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
            <p className="text-sm font-medium">Cartao de credito</p>
            <p className="text-xs text-muted-foreground">Ate 12x</p>
          </div>
        </label>
      </RadioGroup>

      {method === "pix" ? (
        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            inputMode="numeric"
            placeholder="00000000000"
            maxLength={14}
            {...register("payment.cpf")}
          />
          {errors.payment?.cpf && (
            <p className="text-xs text-destructive">
              {errors.payment.cpf.message}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-3">
          {sdkReady ? (
            <CardPayment
              initialization={cardInitialization}
              customization={cardCustomization}
              locale="pt-BR"
              onSubmit={handleCardSubmit}
              onError={handleCardError}
            />
          ) : (
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              Pagamento com cartao indisponivel neste ambiente.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
