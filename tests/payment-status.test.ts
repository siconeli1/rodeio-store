import { describe, expect, it } from "vitest"
import { mapMercadoPagoStatus } from "../lib/payments/status"

describe("mapMercadoPagoStatus", () => {
  it("confirms approved payments", () => {
    expect(mapMercadoPagoStatus("approved")).toMatchObject({
      paymentStatus: "paid",
      orderStatus: "processing",
      shouldConfirmStock: true,
      shouldReleaseStock: false,
    })
  })

  it("releases stock for rejected payments", () => {
    expect(mapMercadoPagoStatus("rejected", "cc_rejected_other_reason")).toMatchObject({
      paymentStatus: "failed",
      orderStatus: "cancelled",
      shouldConfirmStock: false,
      shouldReleaseStock: true,
      failureReason: "cc_rejected_other_reason",
    })
  })

  it("keeps in_process payments pending", () => {
    expect(mapMercadoPagoStatus("in_process")).toMatchObject({
      paymentStatus: "pending",
      orderStatus: "pending",
      shouldConfirmStock: false,
      shouldReleaseStock: false,
    })
  })
})

