export const DEFAULT_VARIANT_SIZE = "Unico"
export const DEFAULT_VARIANT_COLOR = "Padrao"

function normalizeOption(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function isDefaultSizeOption(size: string | null | undefined): boolean {
  const normalized = normalizeOption(size)
  return normalized === "unico" || normalized === "default"
}

export function isDefaultColorOption(
  color: string | null | undefined,
): boolean {
  const normalized = normalizeOption(color)
  return (
    normalized === "padrao" ||
    normalized === "default" ||
    normalized === "sem cor"
  )
}

export function isDefaultVariantOption(
  size: string | null | undefined,
  color: string | null | undefined,
): boolean {
  return isDefaultSizeOption(size) && isDefaultColorOption(color)
}

export function formatVariantOptionLabel(
  color: string | null | undefined,
  size: string | null | undefined,
): string {
  if (isDefaultVariantOption(size, color)) return ""
  if (isDefaultColorOption(color)) return size?.trim() ?? ""
  if (isDefaultSizeOption(size)) return color?.trim() ?? ""
  return [color, size].map((value) => value?.trim()).filter(Boolean).join(" / ")
}
