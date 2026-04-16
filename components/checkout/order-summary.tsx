"use client"

import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/format"
import type { CartItem } from "@/store/cart"

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  shippingCost: number
}

export function OrderSummary({ items, subtotal, shippingCost }: OrderSummaryProps) {
  const total = subtotal + shippingCost

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Resumo do pedido</h2>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                  Sem foto
                </div>
              )}
            </div>
            <div className="flex flex-1 items-start justify-between text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.color} / {item.size} &middot; Qtd: {item.quantity}
                </p>
              </div>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Frete</span>
          <span>{formatPrice(shippingCost)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
