import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { reorderModule } from "@/lib/lessons/repository";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { moduleId?: string; lessonIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId || !Array.isArray(body.lessonIds)) {
    return NextResponse.json(
      { error: "moduleId e lessonIds são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await reorderModule(body.moduleId, body.lessonIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/reorder]", err);
    return NextResponse.json({ error: "Erro ao reordenar." }, { status: 500 });
  }
}
