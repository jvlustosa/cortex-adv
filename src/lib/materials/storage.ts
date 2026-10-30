import {
  COURSE_MATERIALS,
  FREE_MATERIALS_BUCKET,
  publishedMaterials,
  type CourseMaterial,
  type StoredMaterialFile,
} from "@/data/materiais";
import {
  catalogFromList,
  parseStoredCatalog,
  type StoredCatalog,
} from "@/lib/materials/catalog-rules";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

/**
 * Cadastro das apostilas editado pelo /admin. Fica no próprio bucket dos PDFs
 * para não depender de tabela nova no banco. Enquanto o arquivo não existe
 * (ninguém salvou nada pelo admin ainda), vale o catálogo inicial do código
 * (src/data/materiais.ts); o primeiro salvamento grava a lista inteira.
 */
export const CATALOG_PATH = "catalogo.json";

function storage() {
  return createAdminClient().storage.from(FREE_MATERIALS_BUCKET);
}

function canReachStorage(): boolean {
  return isSupabaseEnabled() && isServiceRoleConfigured();
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; statusCode?: string | number; message?: string };
  return (
    e.status === 404 ||
    String(e.statusCode) === "404" ||
    /not.?found|does not exist/i.test(e.message ?? "")
  );
}

/**
 * Catálogo atual. Sem Supabase (modo demo) ou sem o arquivo no bucket, devolve
 * o catálogo inicial do código. Erro de leitura sobe: mostrar a lista antiga
 * faria reaparecer apostila que o admin já excluiu.
 */
export async function loadCatalog(): Promise<StoredCatalog> {
  if (!canReachStorage()) return catalogFromList(COURSE_MATERIALS);

  const { data, error } = await storage().download(CATALOG_PATH);
  if (error) {
    if (isNotFound(error)) return catalogFromList(COURSE_MATERIALS);
    throw error;
  }

  const parsed = parseStoredCatalog(JSON.parse(await data.text()));
  if (!parsed) throw new Error(`${CATALOG_PATH} com formato desconhecido.`);
  return parsed;
}

export async function loadCatalogMaterials(): Promise<CourseMaterial[]> {
  return (await loadCatalog()).materials;
}

export async function findCatalogMaterial(
  id: string,
): Promise<CourseMaterial | undefined> {
  return (await loadCatalog()).materials.find((m) => m.id === id);
}

/**
 * Grava o catálogo inteiro. Quem salva por último vence: dois admins editando
 * ao mesmo tempo podem desfazer a edição um do outro (aceitável para a equipe
 * pequena que cuida disso).
 */
export async function saveCatalog(catalog: StoredCatalog): Promise<void> {
  // O tamanho vem do bucket na hora de mostrar; não guarda número que envelhece.
  const materials = catalog.materials.map((m) => ({
    ...m,
    sizeBytes: undefined,
  }));
  const body = JSON.stringify({ ...catalog, materials }, null, 2);

  const { error } = await storage().upload(CATALOG_PATH, body, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  if (error) throw error;
}

/** Apaga objetos do bucket sem derrubar a operação se algum já não existir. */
export async function removeStorageObjects(paths: string[]): Promise<void> {
  const targets = paths.filter(Boolean);
  if (targets.length === 0) return;
  const { error } = await storage().remove(targets);
  if (error) console.error("[materials] falha ao remover do bucket:", targets, error);
}

function folderOf(filePath: string): string {
  const slash = filePath.lastIndexOf("/");
  return slash === -1 ? "" : filePath.slice(0, slash);
}

/**
 * PDFs que já estão no bucket, por caminho. Lista só as pastas usadas pelo
 * catálogo (raiz e `membros/`), então são uma ou duas chamadas ao Storage.
 */
export async function listStoredMaterialFiles(
  materials: CourseMaterial[],
): Promise<Map<string, StoredMaterialFile>> {
  const folders = [...new Set(materials.map((m) => folderOf(m.filePath)))];
  const stored = new Map<string, StoredMaterialFile>();

  for (const folder of folders) {
    const { data, error } = await storage().list(folder, { limit: 1000 });
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
 * Apostilas que o aluno vê. Sem Supabase (modo demo) não há como conferir o
 * bucket, então mostra o catálogo inteiro. Se só a listagem dos PDFs falhar,
 * também mostra tudo: esconder a página inteira por um soluço do Storage seria
 * pior que um download que pede para tentar de novo.
 */
export async function loadPublishedMaterials(): Promise<CourseMaterial[]> {
  const materials = await loadCatalogMaterials();
  if (!canReachStorage()) return materials;
  try {
    return publishedMaterials(materials, await listStoredMaterialFiles(materials));
  } catch (err) {
    console.error("[materials] falha ao listar o bucket:", err);
    return materials;
  }
}

/** As gratuitas publicadas, para a página pública /materiais. */
export async function loadPublishedFreeMaterials(): Promise<CourseMaterial[]> {
  return (await loadPublishedMaterials()).filter((m) => !m.exclusive);
}

/**
 * Autoriza o browser a subir um arquivo direto no bucket. `upsert` deixa
 * substituir uma versão antiga. Os bytes não passam pela nossa API (a Vercel
 * corta requisição acima de ~4,5 MB).
 */
export async function createMaterialUploadUrl(path: string): Promise<string> {
  const { data, error } = await storage().createSignedUploadUrl(path, {
    upsert: true,
  });
  if (error) throw error;
  return data.signedUrl;
}

/** Bytes da capa, para a rota /api/materiais/capa. null = não existe. */
export async function downloadCover(path: string): Promise<Blob | null> {
  const { data, error } = await storage().download(path);
  if (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
  return data;
}
