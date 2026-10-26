import {
  COURSE_MATERIALS,
  FREE_MATERIALS_BUCKET,
  publishedMaterials,
  type CourseMaterial,
  type StoredMaterialFile,
} from "@/data/materiais";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

function folderOf(filePath: string): string {
  const slash = filePath.lastIndexOf("/");
  return slash === -1 ? "" : filePath.slice(0, slash);
}

/**
 * PDFs que já estão no bucket, por caminho. Lista só as pastas usadas pelo
 * catálogo (raiz e `membros/`), então são uma ou duas chamadas ao Storage.
 */
export async function listStoredMaterialFiles(): Promise<
  Map<string, StoredMaterialFile>
> {
  const storage = createAdminClient().storage.from(FREE_MATERIALS_BUCKET);
  const folders = [...new Set(COURSE_MATERIALS.map((m) => folderOf(m.filePath)))];
  const stored = new Map<string, StoredMaterialFile>();

  for (const folder of folders) {
    const { data, error } = await storage.list(folder, { limit: 1000 });
    if (error) throw error;
    for (const object of data ?? []) {
      // Subpasta aparece na listagem com id null; não é arquivo.
      if (!object.id) continue;
      const path = folder ? `${folder}/${object.name}` : object.name;
      stored.set(path, {
        size: Number(object.metadata?.size ?? 0),
        updatedAt: object.updated_at ?? null,
      });
    }
  }

  return stored;
}

/**
 * Apostilas que o aluno vê em Materiais Didáticos. Sem Supabase (modo demo)
 * não há como conferir o bucket, então mostra o catálogo inteiro. Se a
 * listagem falhar, também mostra tudo: esconder a página inteira por um
 * soluço do Storage seria pior que um download que pede para tentar de novo.
 */
export async function loadPublishedMaterials(): Promise<CourseMaterial[]> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) {
    return COURSE_MATERIALS;
  }
  try {
    return publishedMaterials(COURSE_MATERIALS, await listStoredMaterialFiles());
  } catch (err) {
    console.error("[materials] falha ao listar o bucket:", err);
    return COURSE_MATERIALS;
  }
}

/**
 * Autoriza o browser a subir o PDF direto no bucket, no caminho do catálogo.
 * `upsert` deixa substituir uma versão antiga. Os bytes não passam pela nossa
 * API (a Vercel corta requisição acima de ~4,5 MB).
 */
export async function createMaterialPdfUploadUrl(
  material: CourseMaterial,
): Promise<string> {
  const { data, error } = await createAdminClient()
    .storage.from(FREE_MATERIALS_BUCKET)
    .createSignedUploadUrl(material.filePath, { upsert: true });
  if (error) throw error;
  return data.signedUrl;
}
