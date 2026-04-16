"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Sem imagem
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 transition-all",
                i === activeIndex
                  ? "ring-foreground"
                  : "ring-transparent hover:ring-muted-foreground/40",
              )}
            >
              <Image
                src={src}
                alt={`${alt} — foto ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
