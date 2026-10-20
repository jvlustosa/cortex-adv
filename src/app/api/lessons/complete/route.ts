import { NextResponse } from "next/server";
import {
  recordLessonCompletion,
  removeLessonCompletion,
} from "@/lib/lessons/repository";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { assertProductApi } from "@/lib/course/require-access";

type Body = {
  moduleId?: string;
  lessonId?: string;
};

async function parseTarget(request: Request) {
  const body = (await request.json()) as Body;
  if (!body.moduleId || !body.lessonId) return null;
  return { moduleId: body.moduleId, lessonId: body.lessonId };
}

/** Marca a aula como concluída. */
export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let target;
  try {
    target = await parseTarget(request);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!target) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  // Progresso alimenta o certificado: só quem tem o curso grava.
  const auth = await assertProductApi("curso");
  if ("error" in auth) return auth.error;
  const userId = auth.user.id;

  try {
    await recordLessonCompletion({ ...target, userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/lessons/complete POST]", err);
    return NextResponse.json({ error: "Erro ao concluir aula." }, { status: 500 });
  }
}

/** Desfaz a conclusão da aula. */
export async function DELETE(request: Request) {
  if (isDemoMode() || !isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let target;
  try {
    target = await parseTarget(request);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!target) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  // Progresso alimenta o certificado: só quem tem o curso grava.
  const auth = await assertProductApi("curso");
  if ("error" in auth) return auth.error;
  const userId = auth.user.id;

  try {
    await removeLessonCompletion({ ...target, userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/lessons/complete DELETE]", err);
    return NextResponse.json(
      { error: "Erro ao desfazer conclusão." },
      { status: 500 },
    );
  }
}
