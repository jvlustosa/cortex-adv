import { NextResponse } from "next/server";
import { recordLessonView } from "@/lib/lessons/repository";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

type Body = {
  moduleId?: string;
  lessonId?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.moduleId || !body.lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await recordLessonView({
      moduleId: body.moduleId,
      lessonId: body.lessonId,
      userId: user?.id ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/lessons/view]", err);
    return NextResponse.json({ error: "Erro ao registrar view." }, { status: 500 });
  }
}
