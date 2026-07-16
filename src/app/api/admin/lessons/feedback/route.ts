import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { listFeedbackForLesson } from "@/lib/lessons/repository";

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
    const data = await listFeedbackForLesson(moduleId, lessonId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/admin/lessons/feedback]", err);
    return NextResponse.json({ error: "Erro ao carregar avaliações." }, { status: 500 });
  }
}
