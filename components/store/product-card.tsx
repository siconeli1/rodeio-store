import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatPrice, getDiscountPercent } from "@/lib/format"
import type { ProductWithCategory } from "@/types/database"

interface ProductCardProps {
  product: ProductWithCategory
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount =
    product.compare_price !== null && product.compare_price > product.price
  const discount = hasDiscount
    ? getDiscountPercent(product.price, product.compare_price!)
    : 0
  const imageSrc = product.images[0] ?? null

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            Sem imagem
          </div>
        )}

        {hasDiscount ? (
          <Badge className="absolute left-2 top-2" variant="destructive">
            -{discount}%
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category ? (
          <span className="text-xs text-muted-foreground">
            {product.category.name}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {hasDiscount ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compare_price!)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
