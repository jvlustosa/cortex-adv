import { NextResponse } from "next/server";
import { listLessonMaterials } from "@/lib/lessons/materials";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { assertProductApi } from "@/lib/course/require-access";

export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseEnabled()) {
    return NextResponse.json({ materials: [] });
  }

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  // Materiais são conteúdo do curso: exige sessão e o produto curso.
  const auth = await assertProductApi("curso");
  if ("error" in auth) return auth.error;

  const materials = await listLessonMaterials(moduleId, lessonId);
  return NextResponse.json({ materials });
}
