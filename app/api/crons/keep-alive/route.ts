import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    )

    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      categoryId: data.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    )
  }
}
