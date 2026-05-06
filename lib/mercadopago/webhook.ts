import { createHmac, timingSafeEqual } from "node:crypto"

export interface MercadoPagoSignatureInput {
  dataId: string
  requestId: string
  signatureHeader: string
  secret: string
}

interface ParsedSignature {
  ts: string | null
  v1: string | null
}

export function parseMercadoPagoSignatureHeader(
  signatureHeader: string,
): ParsedSignature {
  const parsed: ParsedSignature = { ts: null, v1: null }

  for (const part of signatureHeader.split(",")) {
    const [rawKey, rawValue] = part.split("=", 2)
    const key = rawKey?.trim()
    const value = rawValue?.trim()
    if (key === "ts") parsed.ts = value ?? null
    if (key === "v1") parsed.v1 = value ?? null
  }

  return parsed
}

export function buildMercadoPagoWebhookManifest(
  dataId: string,
  requestId: string,
  ts: string,
): string {
  return `id:${dataId};request-id:${requestId};ts:${ts};`
}

export function validateMercadoPagoWebhookSignature({
  dataId,
  requestId,
  signatureHeader,
  secret,
}: MercadoPagoSignatureInput): boolean {
  const { ts, v1 } = parseMercadoPagoSignatureHeader(signatureHeader)
  if (!dataId || !requestId || !ts || !v1 || !secret) return false

  const manifest = buildMercadoPagoWebhookManifest(dataId, requestId, ts)
  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected, "hex")
  const receivedBuffer = Buffer.from(v1, "hex")

  if (expectedBuffer.length !== receivedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

