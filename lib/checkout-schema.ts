import { z } from "zod"

export const addressSchema = z.object({
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  zip_code: z.string().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
})

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  name: z.string(),
  image: z.string(),
  price: z.number().positive(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().positive(),
})

const pixPaymentSchema = z.object({
  method: z.literal("pix"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
})

const cardPaymentSchema = z.object({
  method: z.literal("credit_card"),
  cardNumber: z.string().min(13).max(19),
  cardholderName: z.string().min(3),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  expirationMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expirationYear: z.string().regex(/^\d{4}$/),
  securityCode: z.string().min(3).max(4),
  installments: z.number().int().min(1).max(12),
})

export const checkoutSchema = z.object({
  address: addressSchema,
  items: z.array(cartItemSchema).min(1, "O carrinho está vazio"),
  payment: z.discriminatedUnion("method", [pixPaymentSchema, cardPaymentSchema]),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type AddressInput = z.infer<typeof addressSchema>
