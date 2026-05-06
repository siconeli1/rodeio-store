import { describe, expect, it } from "vitest"
import { checkoutSchema } from "../lib/checkout-schema"

const address = {
  full_name: "Joao da Silva",
  phone: "11999999999",
  zip_code: "01001000",
  street: "Rua das Flores",
  number: "123",
  complement: "",
  neighborhood: "Centro",
  city: "Sao Paulo",
  state: "SP",
}

const items = [{ variantId: "00000000-0000-4000-8000-000000000001", quantity: 1 }]

describe("checkoutSchema", () => {
  it("accepts a minimal PIX checkout", () => {
    const parsed = checkoutSchema.safeParse({
      address,
      items,
      payment: { method: "pix", cpf: "123.456.789-01" },
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.payment.cpf).toBe("12345678901")
    }
  })

  it("rejects raw card data in credit card checkout", () => {
    const parsed = checkoutSchema.safeParse({
      address,
      items,
      payment: {
        method: "credit_card",
        cpf: "12345678901",
        token: "card-token-123",
        paymentMethodId: "visa",
        issuerId: "25",
        installments: 1,
        cardNumber: "4111111111111111",
        securityCode: "123",
      },
    })

    expect(parsed.success).toBe(false)
  })
})

