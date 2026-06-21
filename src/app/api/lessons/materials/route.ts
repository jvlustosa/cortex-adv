import { NextResponse } from "next/server";
import { listLessonMaterials } from "@/lib/lessons/materials";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

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

  // Materiais são conteúdo de membro: exige sessão autenticada.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const materials = await listLessonMaterials(moduleId, lessonId);
  return NextResponse.json({ materials });
}
