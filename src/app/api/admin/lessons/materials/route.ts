import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import {
  listLessonMaterialsForAdmin,
  createLessonMaterial,
  deleteLessonMaterial,
} from "@/lib/lessons/materials";

// Limite defensivo pro upload (o bucket é privado, mas evita abuso de memória).
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

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
    return NextResponse.json(
      { error: "Erro ao carregar materiais." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie os dados como multipart/form-data." },
      { status: 400 },
    );
  }

  const moduleId = String(formData.get("moduleId") ?? "").trim();
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const file = formData.get("file");
  const labelRaw = String(formData.get("label") ?? "").trim();

  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Arquivo é obrigatório." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo excede 25 MB." },
      { status: 413 },
    );
  }

  try {
    const material = await createLessonMaterial({
      moduleId,
      lessonId,
      label: labelRaw || file.name,
      file,
    });
    return NextResponse.json({ ok: true, material });
  } catch (err) {
    console.error("[api/admin/lessons/materials POST]", err);
    return NextResponse.json({ error: "Erro ao subir material." }, { status: 500 });
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
      { error: "Erro ao excluir material." },
      { status: 500 },
    );
  }
}
