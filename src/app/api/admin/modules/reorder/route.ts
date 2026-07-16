import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { isDbCourseSource } from "@/lib/supabase/enabled";
import { reorderModules } from "@/lib/lessons/repository-db";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;
  if (!isDbCourseSource()) {
    return NextResponse.json(
      { error: "Gestão de seções requer COURSE_SOURCE=db (curso no banco)." },
      { status: 409 },
    );
  }

  let body: { order?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!Array.isArray(body.order)) {
    return NextResponse.json(
      { error: "order (array de slugs) é obrigatório." },
      { status: 400 },
    );
  }

  try {
    await reorderModules(body.order);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/modules/reorder POST]", err);
    return NextResponse.json({ error: "Erro ao reordenar seções." }, { status: 500 });
  }
}
