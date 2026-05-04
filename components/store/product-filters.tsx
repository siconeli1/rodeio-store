"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/database"

interface ProductFiltersProps {
  categories: Category[]
  availableSizes: string[]
}

export function ProductFilters({
  categories,
  availableSizes,
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get("categoria") ?? ""
  const activeSize = searchParams.get("tamanho") ?? ""

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Trocar de categoria invalida o tamanho atual (a lista de tamanhos é por categoria)
      if (key === "categoria") {
        params.delete("tamanho")
      }
      router.push(`/produtos?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <aside className="space-y-6">
      {/* Categorias */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Categorias</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setParam("categoria", "")}
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                !activeCategory && "bg-muted font-medium text-foreground",
              )}
            >
              Todas
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() =>
                  setParam(
                    "categoria",
                    activeCategory === cat.slug ? "" : cat.slug,
                  )
                }
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                  activeCategory === cat.slug &&
                    "bg-muted font-medium text-foreground",
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tamanhos */}
      {availableSizes.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Tamanho</h3>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  setParam("tamanho", activeSize === size ? "" : size)
                }
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
                  activeSize === size &&
                    "border-foreground bg-foreground text-background",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
