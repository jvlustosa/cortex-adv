// Regras do catálogo de Materiais Didáticos editado pelo /admin. Tudo aqui é
// puro (sem Supabase) para dar para testar: validação do que o admin digita,
// numeração, caminhos no bucket e o formato do catalogo.json.

import {
  MATERIAL_CATEGORIES,
  type CourseMaterial,
  type MaterialCategoryId,
} from "@/data/materiais";

export const CATALOG_VERSION = 1;

/** O que fica gravado em `catalogo.json` no bucket. */
export type StoredCatalog = {
  version: typeof CATALOG_VERSION;
  /**
   * Maior número de apostila já usado, mesmo que ela tenha sido excluída.
   * Evita que uma apostila nova herde o id (e o link) de uma apagada.
   */
  lastId: number;
  materials: CourseMaterial[];
};

/** Campos que o admin preenche no formulário. */
export type MaterialInput = {
  title: string;
  volume: string;
  description: string;
  topics: string[];
  pages: number;
  category: MaterialCategoryId;
  exclusive: boolean;
};

/** Capas enviadas pelo admin ficam nesta pasta do bucket de materiais. */
export const COVER_FOLDER = "capas";

const COVER_EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;
export const COVER_ACCEPT = "image/webp,image/png,image/jpeg,.webp,.png,.jpg,.jpeg";
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

const LIMITS = {
  title: 120,
  volume: 40,
  description: 400,
  topic: 120,
  topics: 8,
  pages: 2000,
};

export function isMaterialCategoryId(value: unknown): value is MaterialCategoryId {
  return MATERIAL_CATEGORIES.some((c) => c.id === value);
}

/** Sem acento, minúsculo, palavras separadas por hífen. */
export function slugify(text: string, maxLength = 48): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, maxLength)
      .replace(/-$/, "") || "apostila"
  );
}

/** "Projetos: o especialista" → "Projetos-O-Especialista" (nome do download). */
function titleCaseSlug(text: string): string {
  return slugify(text)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

export function downloadFileName(id: string, title: string): string {
  return `Claude-Academy-${id}-${titleCaseSlug(title)}.pdf`;
}

/**
 * Caminho do PDF no bucket, fixado na criação. Exclusiva vai para `membros/`,
 * igual ao cadastro antigo. Quem trava o download é o campo `exclusive`, não a
 * pasta, então trocar o acesso depois não exige mover o arquivo.
 */
export function pdfFilePath(id: string, title: string, exclusive: boolean): string {
  return `${exclusive ? "membros/" : ""}apostila-${id}-${slugify(title)}.pdf`;
}

function numericId(id: string): number {
  return /^\d+$/.test(id) ? Number(id) : 0;
}

/** Próximo número livre, com dois dígitos ("09", "10"…). */
export function nextMaterialId(catalog: StoredCatalog): string {
  const highest = Math.max(
    catalog.lastId,
    ...catalog.materials.map((m) => numericId(m.id)),
  );
  return String(highest + 1).padStart(2, "0");
}

export function catalogFromList(materials: CourseMaterial[]): StoredCatalog {
  return {
    version: CATALOG_VERSION,
    lastId: Math.max(0, ...materials.map((m) => numericId(m.id))),
    materials,
  };
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Valida o corpo de criação/edição. `partial` = edição: só confere o que veio.
 * Textos são aparados; tópicos vazios saem.
 */
export function parseMaterialInput(
  body: Record<string, unknown>,
  { partial }: { partial: boolean },
): ValidationResult<Partial<MaterialInput>> {
  const out: Partial<MaterialInput> = {};
  const has = (key: string) => !partial || key in body;

  if (has("title")) {
    const title = asText(body.title);
    if (!title) return { ok: false, error: "O título é obrigatório." };
    if (title.length > LIMITS.title) {
      return { ok: false, error: `Título com mais de ${LIMITS.title} caracteres.` };
    }
    out.title = title;
  }

  if (has("volume")) {
    const volume = asText(body.volume);
    if (volume.length > LIMITS.volume) {
      return { ok: false, error: `Volume com mais de ${LIMITS.volume} caracteres.` };
    }
    out.volume = volume;
  }

  if (has("description")) {
    const description = asText(body.description);
    if (!description) {
      return {
        ok: false,
        error: "A descrição é obrigatória: é o que o aluno lê para escolher.",
      };
    }
    if (description.length > LIMITS.description) {
      return {
        ok: false,
        error: `Descrição com mais de ${LIMITS.description} caracteres.`,
      };
    }
    out.description = description;
  }

  if (has("topics")) {
    const raw = Array.isArray(body.topics) ? body.topics : [];
    const topics = raw.map(asText).filter(Boolean);
    if (topics.length > LIMITS.topics) {
      return { ok: false, error: `No máximo ${LIMITS.topics} tópicos.` };
    }
    if (topics.some((t) => t.length > LIMITS.topic)) {
      return { ok: false, error: `Tópico com mais de ${LIMITS.topic} caracteres.` };
    }
    out.topics = topics;
  }

  if (has("pages")) {
    const pages = Number(body.pages);
    if (!Number.isInteger(pages) || pages < 1 || pages > LIMITS.pages) {
      return { ok: false, error: "Informe o número de páginas (inteiro, 1 ou mais)." };
    }
    out.pages = pages;
  }

  if (has("category")) {
    if (!isMaterialCategoryId(body.category)) {
      return { ok: false, error: "Categoria inválida." };
    }
    out.category = body.category;
  }

  if (has("exclusive")) {
    if (typeof body.exclusive !== "boolean") {
      return { ok: false, error: "Informe se a apostila é gratuita ou exclusiva." };
    }
    out.exclusive = body.exclusive;
  }

  return { ok: true, value: out };
}

/** Monta a apostila nova a partir do formulário. Capa começa vazia. */
export function createMaterial(
  catalog: StoredCatalog,
  input: MaterialInput,
): { catalog: StoredCatalog; material: CourseMaterial } {
  const id = nextMaterialId(catalog);
  const material: CourseMaterial = {
    id,
    ...input,
    filePath: pdfFilePath(id, input.title, input.exclusive),
    fileName: downloadFileName(id, input.title),
    cover: "",
  };
  return {
    material,
    catalog: {
      version: CATALOG_VERSION,
      lastId: Number(id),
      materials: [...catalog.materials, material],
    },
  };
}

/**
 * Aplica a edição. Trocar o título renomeia o arquivo que o aluno baixa, mas
 * o PDF continua no mesmo caminho do bucket.
 */
export function updateMaterial(
  catalog: StoredCatalog,
  id: string,
  patch: Partial<MaterialInput> & { cover?: string },
): { catalog: StoredCatalog; material: CourseMaterial } | null {
  const current = catalog.materials.find((m) => m.id === id);
  if (!current) return null;

  const material: CourseMaterial = {
    ...current,
    ...patch,
    fileName:
      patch.title && patch.title !== current.title
        ? downloadFileName(id, patch.title)
        : current.fileName,
  };
  return {
    material,
    catalog: {
      ...catalog,
      materials: catalog.materials.map((m) => (m.id === id ? material : m)),
    },
  };
}

export function deleteMaterial(
  catalog: StoredCatalog,
  id: string,
): { catalog: StoredCatalog; material: CourseMaterial } | null {
  const material = catalog.materials.find((m) => m.id === id);
  if (!material) return null;
  return {
    material,
    catalog: {
      ...catalog,
      lastId: Math.max(catalog.lastId, numericId(id)),
      materials: catalog.materials.filter((m) => m.id !== id),
    },
  };
}

export function coverExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return (COVER_EXTENSIONS as readonly string[]).includes(ext)
    ? ext === "jpeg"
      ? "jpg"
      : ext
    : null;
}

/** Nome versionado: trocar a capa muda a URL, então o cache longo não atrapalha. */
export function coverStoragePath(id: string, ext: string, now = Date.now()): string {
  return `${COVER_FOLDER}/${id}-${now}.${ext}`;
}

const COVER_FILE_RE = /^[0-9a-z]+-\d+\.(webp|png|jpg)$/;

/** Confere que o caminho é uma capa desta apostila, gerada por coverStoragePath. */
export function isCoverPathFor(id: string, path: string): boolean {
  const prefix = `${COVER_FOLDER}/`;
  if (!path.startsWith(prefix)) return false;
  const file = path.slice(prefix.length);
  return COVER_FILE_RE.test(file) && file.startsWith(`${id}-`);
}

export function isCoverFileName(file: string): boolean {
  return COVER_FILE_RE.test(file);
}

export const COVER_CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
};

/**
 * Endereço da capa para o <Image>. Capa antiga é arquivo de public/; capa
 * enviada pelo admin passa pela rota que lê o bucket. Vazio = sem capa.
 */
export function materialCoverSrc(cover: string): string | null {
  if (!cover) return null;
  if (cover.startsWith("/")) return cover;
  if (cover.startsWith(`${COVER_FOLDER}/`)) {
    return `/api/materiais/capa/${cover.slice(COVER_FOLDER.length + 1)}`;
  }
  return null;
}

/**
 * Lê o catalogo.json. Entrada com campo faltando ou categoria que não existe
 * mais fica de fora, em vez de derrubar a página inteira.
 */
export function parseStoredCatalog(raw: unknown): StoredCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (data.version !== CATALOG_VERSION || !Array.isArray(data.materials)) {
    return null;
  }

  const materials: CourseMaterial[] = [];
  for (const item of data.materials) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const id = asText(m.id);
    const filePath = asText(m.filePath);
    if (!id || !filePath || !isMaterialCategoryId(m.category)) {
      console.warn("[materials] entrada inválida no catálogo:", m.id);
      continue;
    }
    materials.push({
      id,
      category: m.category,
      volume: asText(m.volume),
      title: asText(m.title),
      description: asText(m.description),
      topics: Array.isArray(m.topics) ? m.topics.map(asText).filter(Boolean) : [],
      pages: Number(m.pages) || 0,
      filePath,
      fileName: asText(m.fileName) || downloadFileName(id, asText(m.title)),
      cover: asText(m.cover),
      exclusive: m.exclusive === true,
    });
  }

  return {
    version: CATALOG_VERSION,
    lastId: Number(data.lastId) || 0,
    materials,
  };
}
