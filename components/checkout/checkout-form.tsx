"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { addressSchema } from "@/lib/checkout-schema"
import { getShippingCost } from "@/lib/shipping"
import { AddressForm } from "./address-form"
import {
  PaymentForm,
  type CardPaymentBrickData,
} from "./payment-form"
import { OrderSummary } from "./order-summary"

const SHIPPING_COST = getShippingCost()

const checkoutFormSchema = z.object({
  address: addressSchema,
  payment: z.object({
    method: z.enum(["pix", "credit_card"]),
    cpf: z.string().min(11, "CPF deve ter 11 digitos"),
  }),
  total: z.number(),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

type PaymentPayload =
  | { method: "pix"; cpf: string }
  | {
      method: "credit_card"
      cpf: string
      token: string
      paymentMethodId: string
      issuerId: string | number | null
      installments: number
    }

function onlyDigits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "")
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function CheckoutForm() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const attemptKeyRef = useRef<string | null>(null)

  useEffect(() => setMounted(true), [])

  const subtotal = getSubtotal()
  const total = subtotal + SHIPPING_COST

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      address: {
        full_name: "",
        phone: "",
        zip_code: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      payment: {
        method: "pix",
        cpf: "",
      },
      total,
    },
  })

  const method = form.watch("payment.method")

  useEffect(() => {
    form.setValue("total", total)
  }, [total, form])

  function getAttemptKey(): string {
    attemptKeyRef.current ??= newIdempotencyKey()
    return attemptKeyRef.current
  }

  async function submitCheckout(payment: PaymentPayload) {
    if (items.length === 0) {
      toast.error("Seu carrinho esta vazio")
      throw new Error("Carrinho vazio")
    }

    setSubmitting(true)

    try {
      const payload = {
        address: form.getValues("address"),
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        payment,
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": getAttemptKey(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status < 500) attemptKeyRef.current = null
        toast.error(data.error || "Erro ao processar pedido")
        throw new Error(data.error || "Erro ao processar pedido")
      }

      clearCart()
      attemptKeyRef.current = null

      if (data.paymentMethod === "pix") {
        router.push(`/checkout/pix/${data.orderId}`)
      } else {
        router.push(`/checkout/sucesso/${data.orderId}`)
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Erro de conexao. Tente novamente.")
      }
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePixSubmit() {
    const valid = await form.trigger(["address", "payment.cpf"])
    if (!valid) {
      toast.error("Revise os dados de entrega e CPF")
      return
    }

    await submitCheckout({
      method: "pix",
      cpf: onlyDigits(form.getValues("payment.cpf")),
    }).catch(() => {})
  }

  async function handleCardSubmit(cardData: CardPaymentBrickData) {
    const valid = await form.trigger("address")
    if (!valid) {
      toast.error("Revise os dados de entrega antes de pagar")
      throw new Error("Endereco invalido")
    }

    const cpf = onlyDigits(cardData.payer?.identification?.number)
    if (cpf.length !== 11) {
      toast.error("CPF do titular do cartao invalido")
      throw new Error("CPF invalido")
    }

    await submitCheckout({
      method: "credit_card",
      cpf,
      token: cardData.token,
      paymentMethodId: cardData.payment_method_id,
      issuerId: cardData.issuer_id ?? null,
      installments: cardData.installments,
    })
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="size-16 text-muted-foreground/40" />
        <h1 className="text-xl font-semibold">Seu carrinho esta vazio</h1>
        <p className="text-sm text-muted-foreground">
          Adicione produtos antes de ir para o checkout.
        </p>
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <AddressForm form={form} />
        <PaymentForm
          form={form}
          total={total}
          onCardSubmit={handleCardSubmit}
        />
      </div>

      <div className="space-y-4">
        <OrderSummary
          items={items}
          subtotal={subtotal}
          shippingCost={SHIPPING_COST}
        />
        {method === "pix" ? (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={submitting}
            onClick={handlePixSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Gerar QR Code PIX"
            )}
          </Button>
        ) : (
          <p className="rounded-lg border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
            Finalize pelo formulario seguro de cartao ao lado.
          </p>
        )}
      </div>
    </div>
  )
}
