"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
] as const

export function ProductSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("ordem") ?? "newest"

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "newest") {
      params.delete("ordem")
    } else {
      params.set("ordem", value)
    }
    router.push(`/produtos?${params.toString()}`, { scroll: false })
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
