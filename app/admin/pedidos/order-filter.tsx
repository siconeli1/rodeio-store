"use client"

import { useRouter, useSearchParams } from "next/navigation"

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Em processamento" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
]

export function OrderFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("status") ?? ""

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const params = new URLSearchParams()
    if (val) params.set("status", val)
    router.push(`/admin/pedidos?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
