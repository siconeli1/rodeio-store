"use client"

import { useMemo, useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ImageGallery } from "./image-gallery"
import { formatPrice, getDiscountPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import type { ProductWithVariants, ProductVariant } from "@/types/database"

interface ProductDetailProps {
  product: ProductWithVariants
}

export function ProductDetail({ product }: ProductDetailProps) {
  const variants = product.product_variants
  const colorImagesByColor = useMemo(() => {
    const map = new Map<string, string[]>()
    product.product_color_images?.forEach((c) => {
      if (c.images.length > 0) map.set(c.color, c.images)
    })
    return map
  }, [product.product_color_images])

  const colors = useMemo(() => {
    const map = new Map<string, { hex: string | null }>()
    variants.forEach((v) => {
      if (!map.has(v.color)) map.set(v.color, { hex: v.color_hex })
    })
    return Array.from(map.entries()).map(([name, meta]) => ({
      name,
      hex: meta.hex,
    }))
  }, [variants])

  const sizes = useMemo(() => {
    const order = ["PP", "P", "M", "G", "GG", "XG", "Único"]
    const unique = [...new Set(variants.map((v) => v.size))]
    return unique.sort(
      (a, b) =>
        (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
    )
  }, [variants])

  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? "")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)

  // Galeria: imagens da cor selecionada (com fallback para product.images)
  const galleryImages = useMemo(() => {
    const fromColor = colorImagesByColor.get(selectedColor)
    if (fromColor && fromColor.length > 0) return fromColor
    return product.images
  }, [colorImagesByColor, selectedColor, product.images])

  const selectedVariant: ProductVariant | undefined = useMemo(
    () =>
      variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ),
    [variants, selectedColor, selectedSize],
  )

  const sizesForColor = useMemo(
    () =>
      variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size),
    [variants, selectedColor],
  )

  const hasDiscount =
    product.compare_price !== null && product.compare_price > product.price
  const discount = hasDiscount
    ? getDiscountPercent(product.price, product.compare_price!)
    : 0

  const { addToCart, openCart } = useCartStore()

  function handleAddToCart() {
    if (!selectedVariant) {
      toast.error("Selecione o tamanho e a cor.")
      return
    }
    if (selectedVariant.stock < quantity) {
      toast.error("Quantidade indisponível no estoque.")
      return
    }
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: galleryImages[0] ?? product.images[0] ?? "",
      price: product.price,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity,
      stock: selectedVariant.stock,
    })
    toast.success(`${product.name} adicionado ao carrinho!`)
    openCart()
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <ImageGallery
        key={selectedColor}
        images={galleryImages}
        alt={product.name}
      />

      <div className="flex flex-col gap-4">
        {product.category ? (
          <span className="text-sm text-muted-foreground">
            {product.category.name}
          </span>
        ) : null}

        <h1 className="font-heading text-2xl font-semibold tracking-tight lg:text-3xl">
          {product.name}
        </h1>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold">
            {formatPrice(product.price)}
          </span>
          {hasDiscount ? (
            <>
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compare_price!)}
              </span>
              <Badge variant="destructive">-{discount}%</Badge>
            </>
          ) : null}
        </div>

        <Separator />

        {/* Cor */}
        {colors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Cor: <span className="font-normal">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color.name)
                    setSelectedSize("")
                    setQuantity(1)
                  }}
                  title={color.name}
                  className={cn(
                    "size-9 rounded-full border-2 transition-all",
                    selectedColor === color.name
                      ? "border-foreground ring-2 ring-foreground ring-offset-2"
                      : "border-border hover:border-foreground/40",
                  )}
                  style={{
                    backgroundColor: color.hex ?? undefined,
                  }}
                >
                  {!color.hex ? (
                    <span className="flex size-full items-center justify-center text-[10px]">
                      {color.name.slice(0, 2)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tamanho */}
        {sizes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const available = sizesForColor.includes(size)
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (available) {
                        setSelectedSize(size)
                        setQuantity(1)
                      }
                    }}
                    disabled={!available}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : available
                          ? "hover:bg-muted"
                          : "cursor-not-allowed border-dashed opacity-40",
                    )}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Estoque */}
        {selectedVariant ? (
          <p className="text-xs text-muted-foreground">
            {selectedVariant.stock > 5
              ? "Em estoque"
              : selectedVariant.stock > 0
                ? `Últimas ${selectedVariant.stock} unidades`
                : "Esgotado"}
          </p>
        ) : null}

        {/* Quantidade */}
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">Quantidade</p>
          <div className="flex items-center rounded-md border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity((q) =>
                  Math.min(selectedVariant?.stock ?? 10, q + 1),
                )
              }
              className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-2 w-full gap-2"
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.stock === 0}
        >
          <ShoppingCart className="size-4" />
          Adicionar ao carrinho
        </Button>

        {/* Descrição */}
        {product.description ? (
          <div className="mt-4 space-y-2">
            <Separator />
            <h2 className="text-sm font-semibold">Descrição</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
