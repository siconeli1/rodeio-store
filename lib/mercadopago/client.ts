import { MercadoPagoConfig, Payment } from "mercadopago"
import { getRequiredEnv } from "@/lib/env"

let paymentClient: Payment | null = null

export function getMercadoPagoPayment(): Payment {
  if (!paymentClient) {
    const config = new MercadoPagoConfig({
      accessToken: getRequiredEnv("MERCADOPAGO_ACCESS_TOKEN"),
    })
    paymentClient = new Payment(config)
  }

  return paymentClient
}
