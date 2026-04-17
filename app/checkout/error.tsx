"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutError({
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
      <h2 className="text-lg font-semibold">Erro no checkout</h2>
      <p className="text-sm text-muted-foreground">
        Houve um problema ao processar sua compra. Seus itens estão seguros no
        carrinho.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Tentar novamente
        </Button>
        <Button asChild>
          <Link href="/produtos">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  )
}
