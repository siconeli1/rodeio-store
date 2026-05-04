"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, Trash2, Upload, X } from "lucide-react"
import { Popover } from "radix-ui"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Category, ProductWithVariants } from "@/types/database"
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from "./actions"

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

interface VariantRow {
  key: string
  id?: string
  size: string
  color: string
  color_hex: string
  stock: number
  sku: string
}

interface ProductFormProps {
  categories: Category[]
  product?: ProductWithVariants
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)

  const [slug, setSlug] = useState(product?.slug ?? "")
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "")

  // Imagens por cor — chave = nome da cor
  const [colorImages, setColorImages] = useState<Record<string, string[]>>(
    () => {
      const initial: Record<string, string[]> = {}
      product?.product_color_images?.forEach((c) => {
        initial[c.color] = c.images
      })
      return initial
    },
  )
  const [uploadingColor, setUploadingColor] = useState<string | null>(null)

  const MAX_IMAGES_PER_COLOR = 5

  const [variants, setVariants] = useState<VariantRow[]>(() => {
    if (product?.product_variants?.length) {
      return product.product_variants.map((v) => ({
        key: v.id,
        id: v.id,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex ?? "",
        stock: v.stock,
        sku: v.sku ?? "",
      }))
    }
    return [
      {
        key: crypto.randomUUID(),
        size: "",
        color: "",
        color_hex: "",
        stock: 0,
        sku: "",
      },
    ]
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!product) {
      setSlug(toSlug(e.target.value))
    }
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        size: "",
        color: "",
        color_hex: "",
        stock: 0,
        sku: "",
      },
    ])
  }

  function removeVariant(key: string) {
    setVariants((prev) => prev.filter((v) => v.key !== key))
  }

  function updateVariant(key: string, field: keyof VariantRow, value: string | number) {
    setVariants((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)),
    )
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setIsUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const result = await uploadProductImage(fd)
        if (result && "url" in result) {
          setImages((prev) => [...prev, result.url])
        } else {
          toast.error(result?.error ?? "Falha no upload")
        }
      } catch (err) {
        console.error("Falha no upload da imagem:", err)
        const message = err instanceof Error ? err.message : "Falha no upload"
        toast.error(`${file.name}: ${message}`)
      }
    }
    setIsUploading(false)
    // Limpar input para permitir upload do mesmo arquivo
    e.target.value = ""
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((i) => i !== url))
  }

  // Cores únicas derivadas das variantes (ignora linhas sem cor preenchida)
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; hex: string }[] = []
    variants.forEach((v) => {
      const name = v.color.trim()
      if (name && !seen.has(name)) {
        seen.add(name)
        list.push({ name, hex: v.color_hex })
      }
    })
    return list
  }, [variants])

  async function handleColorImageUpload(
    color: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = e.target.files
    if (!files?.length) return

    const current = colorImages[color] ?? []
    const remaining = MAX_IMAGES_PER_COLOR - current.length
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_IMAGES_PER_COLOR} imagens por cor`)
      e.target.value = ""
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    if (files.length > remaining) {
      toast.info(
        `Apenas ${remaining} imagem(ns) enviada(s) — limite de ${MAX_IMAGES_PER_COLOR} por cor.`,
      )
    }

    setUploadingColor(color)
    for (const file of toUpload) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const result = await uploadProductImage(fd)
        if (result && "url" in result) {
          setColorImages((prev) => ({
            ...prev,
            [color]: [...(prev[color] ?? []), result.url],
          }))
        } else {
          toast.error(result?.error ?? "Falha no upload")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha no upload"
        toast.error(`${file.name}: ${message}`)
      }
    }
    setUploadingColor(null)
    e.target.value = ""
  }

  function removeColorImage(color: string, url: string) {
    setColorImages((prev) => ({
      ...prev,
      [color]: (prev[color] ?? []).filter((u) => u !== url),
    }))
  }

  function handleSubmit(formData: FormData) {
    const input: ProductInput = {
      name: formData.get("name") as string,
      slug,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      compare_price: formData.get("compare_price")
        ? Number(formData.get("compare_price"))
        : undefined,
      category_id: categoryId || undefined,
      images,
      is_active: isActive,
      is_featured: isFeatured,
      variants: variants
        .filter((v) => v.size && v.color)
        .map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          color_hex: v.color_hex,
          stock: v.stock,
          sku: v.sku,
        })),
      color_images: uniqueColors
        .map((c) => ({
          color: c.name,
          images: colorImages[c.name] ?? [],
        }))
        .filter((c) => c.images.length > 0),
    }

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input)

      if (result.success) {
        toast.success(product ? "Produto atualizado!" : "Produto criado!")
        router.push("/admin/produtos")
      } else {
        toast.error(result.error ?? "Erro ao salvar")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Dados básicos */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Dados do produto</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name ?? ""}
              onChange={handleNameChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price ?? ""}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compare_price">Preço comparativo (R$)</Label>
            <Input
              id="compare_price"
              name="compare_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compare_price ?? ""}
            />
            <p className="text-xs text-muted-foreground">Preço riscado</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoria</Label>
            <select
              id="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="is_featured"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
            <Label htmlFor="is_featured">Em destaque</Label>
          </div>
        </div>
      </Card>

      {/* Imagens */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Imagens</h2>

        <div className="flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="group relative size-24 overflow-hidden rounded-md border">
              <Image
                src={url}
                alt="Produto"
                fill
                className="object-cover"
                sizes="96px"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Upload className="size-5" />
            <span className="text-[10px]">
              {isUploading ? "Enviando..." : "Upload"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </Card>

      {/* Imagens por cor */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Imagens por cor</h2>
          <p className="text-xs text-muted-foreground">
            Até {MAX_IMAGES_PER_COLOR} imagens por cor. As cores são puxadas das variantes abaixo.
          </p>
        </div>

        {uniqueColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Adicione variantes com cor preenchida para habilitar o upload por cor.
          </p>
        ) : (
          <div className="space-y-4">
            {uniqueColors.map((color) => {
              const list = colorImages[color.name] ?? []
              const atLimit = list.length >= MAX_IMAGES_PER_COLOR
              const isUploadingThis = uploadingColor === color.name
              return (
                <div key={color.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {color.hex ? (
                      <span
                        className="size-5 rounded-full border"
                        style={{ backgroundColor: color.hex }}
                      />
                    ) : null}
                    <p className="text-sm font-medium">{color.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {list.length}/{MAX_IMAGES_PER_COLOR}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {list.map((url) => (
                      <div
                        key={url}
                        className="group relative size-24 overflow-hidden rounded-md border"
                      >
                        <Image
                          src={url}
                          alt={color.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <button
                          type="button"
                          onClick={() => removeColorImage(color.name, url)}
                          className="absolute right-1 top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}

                    {!atLimit ? (
                      <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                        <Upload className="size-5" />
                        <span className="text-[10px]">
                          {isUploadingThis ? "Enviando..." : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleColorImageUpload(color.name, e)}
                          disabled={isUploadingThis}
                          className="hidden"
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Variantes */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Variantes</h2>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="mr-1 size-4" />
            Adicionar
          </Button>
        </div>

        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma variante adicionada.
          </p>
        ) : (
          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={v.key}>
                {idx > 0 && <Separator className="mb-3" />}
                <div className="grid gap-3 sm:grid-cols-6 items-end">
                  <div className="space-y-1.5">
                    <Label>Tamanho</Label>
                    <Input
                      value={v.size}
                      onChange={(e) =>
                        updateVariant(v.key, "size", e.target.value)
                      }
                      placeholder="M"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cor</Label>
                    <Input
                      value={v.color}
                      onChange={(e) =>
                        updateVariant(v.key, "color", e.target.value)
                      }
                      placeholder="Azul"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hex</Label>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-2 text-sm shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <span
                            className="size-5 shrink-0 rounded border"
                            style={{
                              backgroundColor: v.color_hex || "transparent",
                              backgroundImage: v.color_hex
                                ? undefined
                                : "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)",
                              backgroundSize: "8px 8px",
                              backgroundPosition:
                                "0 0, 0 4px, 4px -4px, -4px 0",
                            }}
                          />
                          <span className="truncate font-mono text-xs">
                            {v.color_hex || "Escolher"}
                          </span>
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          align="start"
                          sideOffset={6}
                          className="z-50 rounded-md border bg-popover p-3 shadow-md"
                        >
                          <HexColorPicker
                            color={v.color_hex || "#000000"}
                            onChange={(hex) =>
                              updateVariant(v.key, "color_hex", hex)
                            }
                          />
                          <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
                            {v.color_hex || "—"}
                          </p>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estoque</Label>
                    <Input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(v.key, "stock", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SKU</Label>
                    <Input
                      value={v.sku}
                      onChange={(e) =>
                        updateVariant(v.key, "sku", e.target.value)
                      }
                      placeholder="CAM-AZ-M"
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(v.key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending || isUploading || uploadingColor !== null}
        >
          {isPending ? "Salvando..." : product ? "Salvar alterações" : "Criar produto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/produtos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
