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

/** Metadados de um material, sem signed URL (uso no painel admin). */
export type LessonMaterialAdmin = {
  id: string;
  label: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
};

/** Lista materiais de uma aula para o painel (metadados, sem download). */
export async function listLessonMaterialsForAdmin(
  moduleId: string,
  lessonId: string,
): Promise<LessonMaterialAdmin[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_materials")
    .select("id, label, file_name, content_type, size_bytes, sort_order")
    .eq("module_id", moduleId)
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as LessonMaterialRow[]).map((row) => ({
    id: row.id,
    label: row.label,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  }));
}

/**
 * Content-type confiável. Navegadores costumam mandar `.md`/`.html` sem MIME
 * (type vazio) — sem isso o arquivo fica como octet-stream e o visualizador não
 * sabe renderizar. Deriva pela extensão quando o browser não informou.
 */
const EXT_CONTENT_TYPE: Record<string, string> = {
  md: "text/markdown",
  markdown: "text/markdown",
  html: "text/html",
  htm: "text/html",
  txt: "text/plain",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function inferContentType(fileName: string, provided: string): string {
  if (provided && provided !== "application/octet-stream") return provided;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? provided ?? "application/octet-stream";
}

/** Nome de arquivo seguro pro storage (sem acentos/espaços/barras). */
function safeFileName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "arquivo";
}

/**
 * Sobe um arquivo pro bucket privado e cadastra o material da aula. O arquivo
 * fica em `<moduleId>/<lessonId>/<uuid>-<nome>` para evitar colisão de nomes.
 */
export async function createLessonMaterial(input: {
  moduleId: string;
  lessonId: string;
  label: string;
  file: File;
}): Promise<LessonMaterialAdmin> {
  const admin = createAdminClient();

  const fileName = input.file.name || "arquivo";
  const contentType = inferContentType(fileName, input.file.type);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const filePath = `${input.moduleId}/${input.lessonId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;

  const { error: uploadError } = await admin.storage
    .from(LESSON_MATERIALS_BUCKET)
    .upload(filePath, buffer, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  // Próxima posição = maior sort_order da aula + 1.
  const { data: last } = await admin
    .from("lesson_materials")
    .select("sort_order")
    .eq("module_id", input.moduleId)
    .eq("lesson_id", input.lessonId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from("lesson_materials")
    .insert({
      module_id: input.moduleId,
      lesson_id: input.lessonId,
      label: input.label,
      file_path: filePath,
      file_name: fileName,
      content_type: contentType,
      size_bytes: input.file.size,
      sort_order: sortOrder,
    })
    .select("id, label, file_name, content_type, size_bytes, sort_order")
    .single();

  if (error) {
    // Rollback do arquivo se o insert falhar — não deixa lixo no bucket.
    await admin.storage.from(LESSON_MATERIALS_BUCKET).remove([filePath]);
    throw error;
  }

  const row = data as LessonMaterialRow;
  return {
    id: row.id,
    label: row.label,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  };
}

/** Remove o material (linha + arquivo no bucket). */
export async function deleteLessonMaterial(id: string): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("lesson_materials")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;

  await admin.storage
    .from(LESSON_MATERIALS_BUCKET)
    .remove([(data as { file_path: string }).file_path]);

  const { error: delError } = await admin
    .from("lesson_materials")
    .delete()
    .eq("id", id);
  if (delError) throw delError;
}
