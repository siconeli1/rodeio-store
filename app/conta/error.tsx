"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContaError({
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
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold">Erro ao carregar</h2>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar seus dados. Tente novamente.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Tentar novamente
        </Button>
        <Button asChild>
          <Link href="/conta">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
