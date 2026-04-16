"use client"

import { useEffect, useState } from "react"
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
import { AddressForm } from "./address-form"
import { PaymentForm } from "./payment-form"
import { OrderSummary } from "./order-summary"

const SHIPPING_COST = 15

// Schema do formulário do lado client (sem discriminatedUnion para melhor UX)
const checkoutFormSchema = z.object({
  address: addressSchema,
  payment: z.object({
    method: z.enum(["pix", "credit_card"]),
    cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
    // Campos de cartão são validados condicionalmente no submit
    cardNumber: z.string().optional(),
    cardholderName: z.string().optional(),
    expirationMonth: z.string().optional(),
    expirationYear: z.string().optional(),
    securityCode: z.string().optional(),
    installments: z.number().optional(),
  }),
  total: z.number(),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export function CheckoutForm() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

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
        cardNumber: "",
        cardholderName: "",
        expirationMonth: "",
        expirationYear: "",
        securityCode: "",
        installments: 1,
      },
      total,
    },
  })

  // Atualizar total quando subtotal mudar
  useEffect(() => {
    form.setValue("total", total)
  }, [total, form])

  async function onSubmit(values: CheckoutFormValues) {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio")
      return
    }

    // Validação extra para cartão
    if (values.payment.method === "credit_card") {
      if (!values.payment.cardNumber || values.payment.cardNumber.length < 13) {
        toast.error("Número do cartão inválido")
        return
      }
      if (!values.payment.cardholderName || values.payment.cardholderName.length < 3) {
        toast.error("Nome no cartão é obrigatório")
        return
      }
      if (!values.payment.expirationMonth || !values.payment.expirationYear) {
        toast.error("Validade do cartão é obrigatória")
        return
      }
      if (!values.payment.securityCode || values.payment.securityCode.length < 3) {
        toast.error("CVV inválido")
        return
      }
    }

    setSubmitting(true)

    try {
      const payload = {
        address: values.address,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name,
          image: i.image,
          price: i.price,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        payment:
          values.payment.method === "pix"
            ? { method: "pix" as const, cpf: values.payment.cpf }
            : {
                method: "credit_card" as const,
                cpf: values.payment.cpf,
                cardNumber: values.payment.cardNumber!,
                cardholderName: values.payment.cardholderName!,
                expirationMonth: values.payment.expirationMonth!,
                expirationYear: values.payment.expirationYear!,
                securityCode: values.payment.securityCode!,
                installments: values.payment.installments ?? 1,
              },
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao processar pedido")
        return
      }

      clearCart()

      if (data.paymentMethod === "pix") {
        router.push(`/checkout/pix/${data.orderId}`)
      } else {
        router.push(`/checkout/sucesso/${data.orderId}`)
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="size-16 text-muted-foreground/40" />
        <h1 className="text-xl font-semibold">Seu carrinho está vazio</h1>
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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <AddressForm form={form} />
          <PaymentForm form={form} />
        </div>

        <div className="space-y-4">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingCost={SHIPPING_COST}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Finalizar pedido"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
