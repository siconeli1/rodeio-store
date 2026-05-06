export type PaymentStatus = "pending" | "paid" | "failed"
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

export interface MercadoPagoStatusMapping {
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  shouldConfirmStock: boolean
  shouldReleaseStock: boolean
  failureReason: string | null
}

const FAILED_STATUSES = new Set([
  "cancelled",
  "charged_back",
  "expired",
  "refunded",
  "rejected",
])

const PENDING_STATUSES = new Set([
  "authorized",
  "in_mediation",
  "in_process",
  "pending",
])

export function mapMercadoPagoStatus(
  status: string | null | undefined,
  statusDetail?: string | null,
): MercadoPagoStatusMapping {
  if (status === "approved") {
    return {
      paymentStatus: "paid",
      orderStatus: "processing",
      shouldConfirmStock: true,
      shouldReleaseStock: false,
      failureReason: null,
    }
  }

  if (status && FAILED_STATUSES.has(status)) {
    return {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      shouldConfirmStock: false,
      shouldReleaseStock: true,
      failureReason: getFailureReason(status, statusDetail),
    }
  }

  if (!status || PENDING_STATUSES.has(status)) {
    return {
      paymentStatus: "pending",
      orderStatus: "pending",
      shouldConfirmStock: false,
      shouldReleaseStock: false,
      failureReason: null,
    }
  }

  return {
    paymentStatus: "pending",
    orderStatus: "pending",
    shouldConfirmStock: false,
    shouldReleaseStock: false,
    failureReason: null,
  }
}

export function getFailureReason(
  status: string | null | undefined,
  statusDetail?: string | null,
): string {
  if (statusDetail) return statusDetail
  if (status === "expired") return "Pagamento expirado"
  if (status === "cancelled") return "Pagamento cancelado"
  if (status === "rejected") return "Pagamento recusado"
  if (status === "refunded") return "Pagamento estornado"
  if (status === "charged_back") return "Pagamento contestado"
  return "Pagamento nao aprovado"
}

export function shouldKeepCurrentOrderStatus(status: string): boolean {
  return status === "shipped" || status === "delivered"
}

