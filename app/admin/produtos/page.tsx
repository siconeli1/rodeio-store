import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/format"
import { ProductSearch } from "./product-search"
import type { Category } from "@/types/database"

export const metadata = {
  title: "Produtos — Admin RodeioStore",
}

interface AdminProduct {
  id: string
  name: string
  slug: string
  price: number
  is_active: boolean
  is_featured: boolean
  images: string[]
  category: Category | null
  product_variants: { stock: number }[]
}

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("id, name, slug, price, is_active, is_featured, images, category:categories(*), product_variants(stock)")
    .order("created_at", { ascending: false })

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  const { data } = await query
  const products = (data ?? []) as unknown as AdminProduct[]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o catálogo de produtos.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/produtos/novo">
            <Plus className="mr-1 size-4" />
            Novo produto
          </Link>
        </Button>
      </header>

      <ProductSearch />

      {products.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {q ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoria
                </TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Estoque
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Status
                </TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const totalStock = p.product_variants.reduce(
                  (sum, v) => sum + v.stock,
                  0,
                )
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded border bg-muted">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[8px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={
                          totalStock === 0
                            ? "font-semibold text-destructive"
                            : ""
                        }
                      >
                        {totalStock}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1">
                        {p.is_active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                        {p.is_featured && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/produtos/${p.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
