import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { setPublishedBatch } from "@/lib/lessons/repository";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: {
    keys?: { moduleId: string; lessonId: string }[];
    published?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!Array.isArray(body.keys) || typeof body.published !== "boolean") {
    return NextResponse.json(
      { error: "keys[] e published são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await setPublishedBatch(body.keys, body.published);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/batch]", err);
    return NextResponse.json({ error: "Erro ao atualizar em lote." }, { status: 500 });
  }
}
