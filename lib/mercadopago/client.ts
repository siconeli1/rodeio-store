import { MercadoPagoConfig, Payment } from "mercadopago"

const config = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const payment = new Payment(config)
