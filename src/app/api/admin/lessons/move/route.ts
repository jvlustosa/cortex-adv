import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { isDbCourseSource } from "@/lib/supabase/enabled";
import { moveLesson } from "@/lib/lessons/repository";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  if (!isDbCourseSource()) {
    return NextResponse.json(
      {
        error:
          "Mover aula entre módulos exige COURSE_SOURCE=db (curso no banco).",
      },
      { status: 409 },
    );
  }

  let body: {
    fromModuleId?: string;
    lessonId?: string;
    toModuleId?: string;
    beforeLessonId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.fromModuleId || !body.lessonId || !body.toModuleId) {
    return NextResponse.json(
      { error: "fromModuleId, lessonId e toModuleId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await moveLesson({
      fromModuleId: body.fromModuleId,
      lessonId: body.lessonId,
      toModuleId: body.toModuleId,
      beforeLessonId: body.beforeLessonId ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/move POST]", err);
    return NextResponse.json({ error: "Erro ao mover aula." }, { status: 500 });
  }
}
