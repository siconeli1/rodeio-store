import { z } from "zod"

const digitsOnly = (value: unknown) =>
  typeof value === "string" ? value.replace(/\D/g, "") : value

const cpfSchema = z.preprocess(
  digitsOnly,
  z.string().length(11, "CPF deve ter 11 digitos"),
)

export const addressSchema = z
  .object({
    full_name: z.string().min(3, "Nome completo e obrigatorio"),
    phone: z.string().min(10, "Telefone invalido"),
    zip_code: z.string().length(8, "CEP deve ter 8 digitos"),
    street: z.string().min(2, "Rua e obrigatoria"),
    number: z.string().min(1, "Numero e obrigatorio"),
    complement: z.string(),
    neighborhood: z.string().min(2, "Bairro e obrigatorio"),
    city: z.string().min(2, "Cidade e obrigatoria"),
    state: z.string().length(2, "Estado deve ter 2 letras"),
  })
  .strict()

const cartItemSchema = z
  .object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })
  .strict()

const pixPaymentSchema = z
  .object({
    method: z.literal("pix"),
    cpf: cpfSchema,
  })
  .strict()

const cardPaymentSchema = z
  .object({
    method: z.literal("credit_card"),
    cpf: cpfSchema,
    token: z.string().min(8, "Token do cartao invalido"),
    paymentMethodId: z.string().min(2, "Bandeira do cartao invalida"),
    issuerId: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .transform((value) =>
        value === null || value === undefined ? null : String(value),
      ),
    installments: z.coerce.number().int().min(1).max(12),
  })
  .strict()

export const checkoutSchema = z
  .object({
    address: addressSchema,
    items: z.array(cartItemSchema).min(1, "O carrinho esta vazio"),
    payment: z.discriminatedUnion("method", [
      pixPaymentSchema,
      cardPaymentSchema,
    ]),
  })
  .strict()

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type AddressInput = z.infer<typeof addressSchema>
