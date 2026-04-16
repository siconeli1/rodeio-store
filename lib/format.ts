const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatPrice(value: number): string {
  return BRL.format(value)
}

export function getDiscountPercent(
  price: number,
  comparePrice: number,
): number {
  if (comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}
