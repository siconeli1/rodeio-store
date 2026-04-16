import { NextRequest, NextResponse } from "next/server"
import { createClient } from "../../../../lib/supabase/server"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { status: "error", message: "Nao autorizado" },
      { status: 401 },
    )
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      categoryId: data?.id ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}
