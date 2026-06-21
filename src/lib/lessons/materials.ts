import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

export const LESSON_MATERIALS_BUCKET = "lesson-materials";
const SIGNED_URL_TTL_SECONDS = 300;

export type LessonMaterial = {
  id: string;
  label: string;
  fileName: string;
  /** Signed URL temporária; null se a assinatura falhar. */
  url: string | null;
  sizeBytes: number | null;
  contentType: string | null;
};

type LessonMaterialRow = {
  id: string;
  module_id: string;
  lesson_id: string;
  label: string;
  file_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  sort_order: number;
};

/**
 * Materiais de uma aula com signed URL de download. Requer service role (bucket
 * privado). Sem isso, devolve [] — a UI simplesmente não mostra a seção.
 */
export async function listLessonMaterials(
  moduleId: string,
  lessonId: string,
): Promise<LessonMaterial[]> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("lesson_materials")
      .select("*")
      .eq("module_id", moduleId)
      .eq("lesson_id", lessonId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as LessonMaterialRow[];
    const materials: LessonMaterial[] = [];

    for (const row of rows) {
      const { data: signed } = await admin.storage
        .from(LESSON_MATERIALS_BUCKET)
        .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS, {
          download: row.file_name,
        });

      materials.push({
        id: row.id,
        label: row.label,
        fileName: row.file_name,
        url: signed?.signedUrl ?? null,
        sizeBytes: row.size_bytes,
        contentType: row.content_type,
      });
    }

    return materials;
  } catch (err) {
    console.error("[lessons] materials", err);
    return [];
  }
}
