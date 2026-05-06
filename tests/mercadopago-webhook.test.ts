import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  buildMercadoPagoWebhookManifest,
  validateMercadoPagoWebhookSignature,
} from "../lib/mercadopago/webhook"

function signatureFor(dataId: string, requestId: string, ts: string, secret: string) {
  const manifest = buildMercadoPagoWebhookManifest(dataId, requestId, ts)
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex")
  return `ts=${ts},v1=${v1}`
}

describe("Mercado Pago webhook signature", () => {
  it("accepts a valid x-signature", () => {
    const input = {
      dataId: "123456",
      requestId: "req-1",
      secret: "super-secret",
      signatureHeader: signatureFor("123456", "req-1", "1742505638683", "super-secret"),
    }

    expect(validateMercadoPagoWebhookSignature(input)).toBe(true)
  })

  it("rejects a signature with a different request id", () => {
    const signatureHeader = signatureFor(
      "123456",
      "req-1",
      "1742505638683",
      "super-secret",
    )

    expect(
      validateMercadoPagoWebhookSignature({
        dataId: "123456",
        requestId: "req-2",
        secret: "super-secret",
        signatureHeader,
      }),
    ).toBe(false)
  })
})

