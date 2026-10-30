import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  MATERIAL_CATEGORIES,
  type CourseMaterial,
  type StoredMaterialFile,
} from "@/data/materiais";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import type {
  MaterialAdminRow,
  MaterialCategoryOption,
} from "@/lib/materials/admin-types";
import {
  createMaterial,
  deleteMaterial,
  isCoverPathFor,
  materialCoverSrc,
  parseMaterialInput,
  updateMaterial,
  type MaterialInput,
} from "@/lib/materials/catalog-rules";
import {
  listStoredMaterialFiles,
  loadCatalog,
  removeStorageObjects,
  saveCatalog,
} from "@/lib/materials/storage";

export const dynamic = "force-dynamic";

const categoryTitle = new Map<string, string>(
  MATERIAL_CATEGORIES.map((c) => [c.id, c.title]),
);

function toRow(
  m: CourseMaterial,
  stored: Map<string, StoredMaterialFile>,
): MaterialAdminRow {
  return {
    id: m.id,
    title: m.title,
    volume: m.volume,
    description: m.description,
    topics: m.topics,
    pages: m.pages,
    category: m.category,
    categoryTitle: categoryTitle.get(m.category) ?? m.category,
    exclusive: m.exclusive,
    filePath: m.filePath,
    coverSrc: materialCoverSrc(m.cover),
    stored: stored.get(m.filePath) ?? null,
  };
}

/** Linha de uma apostila só, com o estado atual do PDF. */
async function rowFor(m: CourseMaterial): Promise<MaterialAdminRow> {
  return toRow(m, await listStoredMaterialFiles([m]));
}

/** As páginas do aluno leem o catálogo; a pública fica em cache. */
function revalidateMaterialPages() {
  revalidatePath("/materiais");
  revalidatePath("/area-de-membros/materiais");
}

async function readJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function failure(label: string, err: unknown) {
  console.error(`[api/admin/materials ${label}]`, err);
  return NextResponse.json(
    { error: `Não deu para salvar: ${formatErrorDetail(err)}` },
    { status: 500 },
  );
}

/** Catálogo completo com o estado do PDF de cada apostila. */
export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const { materials } = await loadCatalog();
    const stored = await listStoredMaterialFiles(materials);
    const categories: MaterialCategoryOption[] = MATERIAL_CATEGORIES.map(
      (c) => ({ id: c.id, title: c.title }),
    );
    return NextResponse.json({
      materials: materials.map((m) => toRow(m, stored)),
      categories,
    });
  } catch (err) {
    console.error("[api/admin/materials GET]", err);
    return NextResponse.json(
      { error: `Não deu para ler o bucket: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}

/** Cadastra apostila nova. O PDF e a capa sobem depois, pela upload-url. */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = parseMaterialInput(body, { partial: false });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { catalog, material } = createMaterial(
      await loadCatalog(),
      parsed.value as MaterialInput,
    );
    await saveCatalog(catalog);
    revalidateMaterialPages();
    return NextResponse.json({ material: await rowFor(material) });
  } catch (err) {
    return failure("POST", err);
  }
}

/** Edita texto, categoria, acesso ou capa (`cover` = caminho já enviado). */
export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  const body = await readJson(request);
  const id = String(body?.id ?? "").trim();
  if (!body || !id) {
    return NextResponse.json({ error: "Informe a apostila." }, { status: 400 });
  }
  const parsed = parseMaterialInput(body, { partial: true });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const patch: Partial<MaterialInput> & { cover?: string } = parsed.value;
  if ("cover" in body) {
    const cover = String(body.cover ?? "");
    if (!isCoverPathFor(id, cover)) {
      return NextResponse.json({ error: "Capa inválida." }, { status: 400 });
    }
    patch.cover = cover;
  }

  try {
    const catalog = await loadCatalog();
    const previousCover = catalog.materials.find((m) => m.id === id)?.cover;
    const result = updateMaterial(catalog, id, patch);
    if (!result) {
      return NextResponse.json(
        { error: "Apostila não encontrada." },
        { status: 404 },
      );
    }
    await saveCatalog(result.catalog);
    // Capa trocada: a anterior, se veio do admin, não serve mais para nada.
    if (
      patch.cover &&
      previousCover &&
      previousCover !== patch.cover &&
      isCoverPathFor(id, previousCover)
    ) {
      await removeStorageObjects([previousCover]);
    }
    revalidateMaterialPages();
    return NextResponse.json({ material: await rowFor(result.material) });
  } catch (err) {
    return failure("PATCH", err);
  }
}

/** Exclui a apostila do catálogo e apaga o PDF e a capa dela no bucket. */
export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  const body = await readJson(request);
  const id = String(body?.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Informe a apostila." }, { status: 400 });
  }

  try {
    const result = deleteMaterial(await loadCatalog(), id);
    if (!result) {
      return NextResponse.json(
        { error: "Apostila não encontrada." },
        { status: 404 },
      );
    }
    // Catálogo primeiro: se apagar o arquivo falhar, a apostila já saiu do ar.
    await saveCatalog(result.catalog);
    const { material } = result;
    await removeStorageObjects([
      material.filePath,
      isCoverPathFor(id, material.cover) ? material.cover : "",
    ]);
    revalidateMaterialPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure("DELETE", err);
  }
}
