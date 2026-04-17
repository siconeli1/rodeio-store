"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente ou volte à página
        inicial.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Tentar novamente
        </Button>
        <Button asChild>
          <Link href="/">Página inicial</Link>
        </Button>
      </div>
    </div>
  )
}
