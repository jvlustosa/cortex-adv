import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import {
  listLessonMaterialsForAdmin,
  registerLessonMaterial,
  deleteLessonMaterial,
} from "@/lib/lessons/materials";

export async function GET(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");
  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const materials = await listLessonMaterialsForAdmin(moduleId, lessonId);
    return NextResponse.json({ materials });
  } catch (err) {
    console.error("[api/admin/lessons/materials GET]", err);
    // Rota é só admin: devolvemos a causa real. Sem isso, "Erro ao carregar"
    // esconde justamente o que resolve (bucket ausente, chave errada, RLS).
    return NextResponse.json(
      { error: `Não deu para carregar os materiais: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}

/**
 * Cadastra o material. Os bytes já subiram direto pro Storage via a URL
 * assinada de `materials/upload-url`; aqui só chega metadado (JSON leve), por
 * isso o teto de payload da Vercel não entra na conta.
 */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: {
    moduleId?: string;
    lessonId?: string;
    label?: string;
    filePath?: string;
    fileName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const moduleId = String(body.moduleId ?? "").trim();
  const lessonId = String(body.lessonId ?? "").trim();
  const filePath = String(body.filePath ?? "").trim();
  const fileName = String(body.fileName ?? "").trim();
  const labelRaw = String(body.label ?? "").trim();

  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }
  if (!filePath || !fileName) {
    return NextResponse.json(
      { error: "filePath e fileName são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const material = await registerLessonMaterial({
      moduleId,
      lessonId,
      label: labelRaw || fileName,
      filePath,
      fileName,
    });
    return NextResponse.json({ ok: true, material });
  } catch (err) {
    console.error("[api/admin/lessons/materials POST]", err);
    return NextResponse.json(
      { error: `Não deu para salvar o material: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  try {
    await deleteLessonMaterial(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/materials DELETE]", err);
    return NextResponse.json(
      { error: `Não deu para excluir o material: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}
