"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultValue = searchParams.get("q") ?? ""

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const q = (form.get("q") as string).trim()
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    router.push(`/admin/produtos?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-sm">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        name="q"
        placeholder="Buscar produto..."
        defaultValue={defaultValue}
        className="pl-9"
      />
    </form>
  )
}
