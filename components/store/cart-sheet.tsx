"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/format"
import { formatVariantOptionLabel } from "@/lib/product-options"

export function CartSheet() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getItemCount,
    getSubtotal,
  } = useCartStore()

  const itemCount = getItemCount()
  const subtotal = getSubtotal()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrinho ({itemCount})</SheetTitle>
          <SheetDescription className="sr-only">
            Itens no seu carrinho de compras
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Seu carrinho está vazio
            </p>
            <Button variant="outline" size="sm" onClick={closeCart} asChild>
              <Link href="/produtos">Ver produtos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <ul className="space-y-4">
                {items.map((item) => {
                  const optionLabel = formatVariantOptionLabel(
                    item.color,
                    item.size,
                  )

                  return (
                  <li key={item.variantId} className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        {optionLabel ? (
                          <p className="text-xs text-muted-foreground">
                            {optionLabel}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity - 1,
                              )
                            }
                            className="flex size-7 items-center justify-center transition-colors hover:bg-muted"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.stock}
                            className="flex size-7 items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                  )
                })}
              </ul>
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-lg font-bold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Separator />
              <Button className="w-full" size="lg" onClick={closeCart} asChild>
                <Link href="/checkout">Ir para Checkout</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/produtos">Continuar comprando</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
