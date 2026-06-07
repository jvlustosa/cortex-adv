import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import {
  listLessonsForAdmin,
  upsertLessonOverride,
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
  duration?: string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean;
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
      duration: body.duration,
      title: body.title,
      description: body.description,
      published: body.published,
    });
    return NextResponse.json({ ok: true, override: row });
  } catch (err) {
    console.error("[api/admin/lessons PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar aula." }, { status: 500 });
  }
}
