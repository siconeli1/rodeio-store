const DEFAULT_SHIPPING_COST = 15

export function getShippingCost(): number {
  const rawValue = process.env.NEXT_PUBLIC_SHIPPING_COST
  if (!rawValue) return DEFAULT_SHIPPING_COST

  const normalizedValue = rawValue.replace(",", ".").trim()
  const parsed = Number(normalizedValue)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SHIPPING_COST
  }

  return Math.round(parsed * 100) / 100
}
