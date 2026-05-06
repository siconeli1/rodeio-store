"use client"

import { useSyncExternalStore } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { CartSheet } from "./cart-sheet"

function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const persistApi = useCartStore.persist

      if (!persistApi) {
        return () => {}
      }

      if (persistApi.hasHydrated()) {
        queueMicrotask(onStoreChange)
      }

      return persistApi.onFinishHydration(onStoreChange)
    },
    () => useCartStore.persist?.hasHydrated() ?? false,
    () => false,
  )
}

export function CartButton() {
  const { openCart, getItemCount } = useCartStore()
  const itemCount = getItemCount()
  const hydrated = useHasHydrated()

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
        {hydrated && itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {itemCount > 99 ? "99" : itemCount}
          </span>
        ) : null}
      </Button>
      <CartSheet />
    </>
  )
}
