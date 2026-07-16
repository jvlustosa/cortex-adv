import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import {
  listLessonsForAdmin,
  upsertLessonOverride,
  createLesson,
  deleteCustomLesson,
  CatalogLessonError,
} from "@/lib/lessons/repository";

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const data = await listLessonsForAdmin();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/admin/lessons GET]", err);
    return NextResponse.json({ error: "Erro ao carregar aulas." }, { status: 500 });
  }
}

type PatchBody = {
  moduleId?: string;
  lessonId?: string;
  youtubeId?: string | null;
  tella?: string | null;
  duration?: string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean;
  orderIndex?: number | null;
};

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.moduleId || !body.lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const row = await upsertLessonOverride({
      moduleId: body.moduleId,
      lessonId: body.lessonId,
      youtubeId: body.youtubeId,
      tella: body.tella,
      duration: body.duration,
      title: body.title,
      description: body.description,
      published: body.published,
      orderIndex: body.orderIndex,
    });
    return NextResponse.json({ ok: true, override: row });
  } catch (err) {
    console.error("[api/admin/lessons PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar aula." }, { status: 500 });
  }
}

type PostBody = {
  moduleId?: string;
  title?: string;
  tella?: string | null;
  youtubeId?: string | null;
  duration?: string | null;
  description?: string | null;
  published?: boolean;
};

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.moduleId || !body.title?.trim()) {
    return NextResponse.json(
      { error: "moduleId e title são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const lesson = await createLesson({
      moduleId: body.moduleId,
      title: body.title.trim(),
      tella: body.tella ?? null,
      youtubeId: body.youtubeId ?? null,
      duration: body.duration ?? null,
      description: body.description ?? null,
      published: body.published ?? true,
    });
    return NextResponse.json({ ok: true, lesson });
  } catch (err) {
    console.error("[api/admin/lessons POST]", err);
    return NextResponse.json({ error: "Erro ao criar aula." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { moduleId?: string; lessonId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId || !body.lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await deleteCustomLesson(body.moduleId, body.lessonId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CatalogLessonError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/admin/lessons DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir aula." }, { status: 500 });
  }
}
