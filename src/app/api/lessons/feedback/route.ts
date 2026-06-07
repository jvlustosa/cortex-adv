import { NextResponse } from "next/server";
import { upsertLessonFeedback } from "@/lib/lessons/repository";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

type Body = {
  moduleId?: string;
  lessonId?: string;
  rating?: number;
  comment?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Feedback indisponível no modo demo." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para avaliar." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const rating =
    typeof body.rating === "number"
      ? body.rating
      : typeof body.rating === "string"
        ? Number.parseInt(body.rating, 10)
        : NaN;

  if (!body.moduleId || !body.lessonId || !Number.isFinite(rating)) {
    return NextResponse.json(
      { error: "moduleId, lessonId e rating são obrigatórios." },
      { status: 400 },
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Nota deve ser de 1 a 5." }, { status: 400 });
  }

  try {
    const row = await upsertLessonFeedback({
      moduleId: body.moduleId,
      lessonId: body.lessonId,
      userId: user.id,
      rating,
      comment: typeof body.comment === "string" ? body.comment.trim() : null,
    });
    return NextResponse.json({ ok: true, feedback: row });
  } catch (err) {
    console.error("[api/lessons/feedback]", err);
    return NextResponse.json({ error: "Erro ao salvar feedback." }, { status: 500 });
  }
}
