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
  csv: "text/csv",
  json: "application/json",
  yml: "text/yaml",
  yaml: "text/yaml",
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
  // Nunca devolver "": o admin manda este valor no header do PUT, e header
  // vazio faz o Storage recusar o arquivo.
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
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

export type MaterialUploadTicket = {
  /** Caminho definitivo no bucket; volta no registro do material. */
  filePath: string;
  /** URL assinada pro browser subir o arquivo direto no Storage. */
  signedUrl: string;
  /** Content-type que o browser deve mandar no PUT (ver inferContentType). */
  contentType: string;
};

/**
 * Autoriza o browser a subir o arquivo DIRETO no Storage.
 *
 * Os bytes não passam pela nossa API de propósito: a Vercel corta requisição
 * acima de ~4,5 MB antes da função rodar, o que inviabilizava PDF pesado. Aqui
 * o servidor só assina o destino.
 *
 * O arquivo fica em `<moduleId>/<lessonId>/<uuid>-<nome>` para evitar colisão.
 */
export async function createMaterialUploadTicket(input: {
  moduleId: string;
  lessonId: string;
  fileName: string;
  contentType: string;
}): Promise<MaterialUploadTicket> {
  const admin = createAdminClient();

  const fileName = input.fileName || "arquivo";
  const filePath = `${input.moduleId}/${input.lessonId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;

  const { data, error } = await admin.storage
    .from(LESSON_MATERIALS_BUCKET)
    .createSignedUploadUrl(filePath);
  if (error) throw error;

  return {
    filePath,
    signedUrl: data.signedUrl,
    contentType: inferContentType(fileName, input.contentType),
  };
}

/**
 * Cadastra o material depois que o browser já subiu o arquivo. Confere que o
 * objeto existe antes de gravar — sem isso um upload interrompido viraria card
 * quebrado na aula.
 */
export async function registerLessonMaterial(input: {
  moduleId: string;
  lessonId: string;
  label: string;
  filePath: string;
  fileName: string;
}): Promise<LessonMaterialAdmin> {
  const admin = createAdminClient();

  // O prefixo é nosso; não aceitamos caminho de outra aula vindo do cliente.
  const expectedPrefix = `${input.moduleId}/${input.lessonId}/`;
  if (!input.filePath.startsWith(expectedPrefix)) {
    throw new Error("Caminho do arquivo não confere com a aula.");
  }

  const slash = input.filePath.lastIndexOf("/");
  const objectName = input.filePath.slice(slash + 1);
  const { data: found, error: listError } = await admin.storage
    .from(LESSON_MATERIALS_BUCKET)
    .list(input.filePath.slice(0, slash), { search: objectName, limit: 10 });
  if (listError) throw listError;

  // `search` do Storage é aproximado — casa o nome exato para não pegar o
  // metadado de outro arquivo da mesma aula.
  const object = found?.find((item) => item.name === objectName);
  if (!object) throw new Error("O arquivo não chegou no Storage. Tente de novo.");

  const fileName = input.fileName || "arquivo";
  const sizeBytes = (object.metadata?.size as number | undefined) ?? null;
  const contentType = inferContentType(
    fileName,
    (object.metadata?.mimetype as string | undefined) ?? "",
  );
  const filePath = input.filePath;

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
      size_bytes: sizeBytes,
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
