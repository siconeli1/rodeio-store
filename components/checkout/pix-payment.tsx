"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock, Copy, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PixPaymentProps {
  orderId: string
  qrCode: string | null
  qrCodeBase64: string | null
  expiresAt: string | null
  initialPaymentStatus: "pending" | "paid" | "failed"
  failureReason: string | null
}

export function PixPayment({
  orderId,
  qrCode,
  qrCodeBase64,
  expiresAt,
  initialPaymentStatus,
  failureReason,
}: PixPaymentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(initialPaymentStatus === "failed")
  const [paid, setPaid] = useState(initialPaymentStatus === "paid")
  const [failedReason, setFailedReason] = useState<string | null>(
    failureReason,
  )
  const [canceling, setCanceling] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!expiresAt || paid) return

    const expirationDate = new Date(expiresAt)

    function updateTimer() {
      const diff = expirationDate.getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setFailedReason("Pagamento PIX expirado")
        setTimeLeft("00:00")
        return
      }
      const minutes = Math.floor(diff / 60_000)
      const seconds = Math.floor((diff % 60_000) / 1000)
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, paid])

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`)
      if (!res.ok) return
      const data = await res.json()
      if (data.paymentStatus === "paid") {
        setPaid(true)
        toast.success("Pagamento confirmado!")
        router.push(`/checkout/sucesso/${orderId}`)
      }
      if (data.paymentStatus === "failed") {
        setExpired(true)
        setFailedReason(data.failureReason ?? "Pagamento nao aprovado")
      }
    } catch {
      // O polling tenta novamente no proximo ciclo.
    }
  }, [orderId, router])

  useEffect(() => {
    if (expired || paid) return
    pollingRef.current = setInterval(checkStatus, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [checkStatus, expired, paid])

  async function handleCopy() {
    if (!qrCode) return
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      toast.success("Codigo PIX copiado!")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Nao foi possivel copiar")
    }
  }

  async function handleCancel() {
    setCanceling(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Nao foi possivel cancelar")
        return
      }
      setExpired(true)
      setFailedReason("Pedido cancelado pelo cliente")
      toast.success("Pedido cancelado")
    } catch {
      toast.error("Erro de conexao ao cancelar")
    } finally {
      setCanceling(false)
    }
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="size-8" />
        </div>
        <h2 className="text-xl font-semibold">Pagamento confirmado!</h2>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pagamento via PIX</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o codigo para pagar
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        {expired ? (
          <>
            <XCircle className="size-4 text-destructive" />
            <span className="font-medium text-destructive">
              {failedReason ?? "Pagamento nao aprovado"}
            </span>
          </>
        ) : (
          <>
            <Clock className="size-4 text-muted-foreground" />
            <span>
              Expira em <span className="font-mono font-bold">{timeLeft}</span>
            </span>
          </>
        )}
      </div>

      <Card className="flex flex-col items-center gap-4 p-6">
        {qrCodeBase64 ? (
          // QR Code vem como data URL base64 do Mercado Pago.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="size-56"
          />
        ) : (
          <div className="flex size-56 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            QR Code indisponivel
          </div>
        )}

        {qrCode ? (
          <>
            <div className="w-full rounded-md bg-muted p-3">
              <p className="break-all text-center font-mono text-xs leading-relaxed">
                {qrCode}
              </p>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full gap-2"
              disabled={expired}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copiar codigo PIX
                </>
              )}
            </Button>
          </>
        ) : null}
      </Card>

      {expired ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href="/produtos">Fazer novo pedido</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/conta/pedidos">Meus pedidos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Aguardando confirmacao do pagamento...
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            disabled={canceling}
          >
            {canceling ? "Cancelando..." : "Cancelar pedido"}
          </Button>
        </div>
      )}
    </div>
  )
}
