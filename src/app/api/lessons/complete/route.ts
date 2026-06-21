import { NextResponse } from "next/server";
import {
  recordLessonCompletion,
  removeLessonCompletion,
} from "@/lib/lessons/repository";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

type Body = {
  moduleId?: string;
  lessonId?: string;
};

async function parseTarget(request: Request) {
  const body = (await request.json()) as Body;
  if (!body.moduleId || !body.lessonId) return null;
  return { moduleId: body.moduleId, lessonId: body.lessonId };
}

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
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

  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

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

  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

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
