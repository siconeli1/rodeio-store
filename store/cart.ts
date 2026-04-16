import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  variantId: string
  name: string
  image: string
  price: number
  size: string
  color: string
  quantity: number
  stock: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addToCart: (item: CartItem) => void
  removeFromCart: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addToCart: (newItem) => {
        const { items } = get()
        const existing = items.find((i) => i.variantId === newItem.variantId)

        if (existing) {
          const newQty = Math.min(
            existing.quantity + newItem.quantity,
            newItem.stock,
          )
          set({
            items: items.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: newQty, stock: newItem.stock }
                : i,
            ),
          })
        } else {
          set({ items: [...items, newItem] })
        }
      },

      removeFromCart: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) })
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(variantId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i,
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "rodeio-store-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
