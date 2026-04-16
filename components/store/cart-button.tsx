"use client"

import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { CartSheet } from "./cart-sheet"

export function CartButton() {
  const { openCart, getItemCount } = useCartStore()
  const itemCount = getItemCount()

  // Evita mismatch de hidratação (localStorage carrega apenas no client)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={openCart}
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="size-4" />
        {mounted && itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {itemCount > 99 ? "99" : itemCount}
          </span>
        ) : null}
      </Button>
      <CartSheet />
    </>
  )
}
