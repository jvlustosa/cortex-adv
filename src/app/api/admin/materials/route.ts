import { NextResponse } from "next/server";
import { COURSE_MATERIALS, MATERIAL_CATEGORIES } from "@/data/materiais";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import type { MaterialAdminRow } from "@/lib/materials/admin-types";
import { listStoredMaterialFiles } from "@/lib/materials/storage";

export const dynamic = "force-dynamic";

/**
 * Catálogo de Materiais Didáticos com o estado do PDF de cada apostila. O
 * texto vem do código (src/data/materiais.ts); aqui só se confere o bucket.
 */
export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const stored = await listStoredMaterialFiles();
    const categoryTitle = new Map<string, string>(
      MATERIAL_CATEGORIES.map((c) => [c.id, c.title]),
    );

    const materials: MaterialAdminRow[] = COURSE_MATERIALS.map((m) => ({
      id: m.id,
      title: m.title,
      volume: m.volume,
      categoryTitle: categoryTitle.get(m.category) ?? m.category,
      exclusive: m.exclusive,
      filePath: m.filePath,
      stored: stored.get(m.filePath) ?? null,
    }));

    return NextResponse.json({ materials });
  } catch (err) {
    console.error("[api/admin/materials GET]", err);
    return NextResponse.json(
      { error: `Não deu para ler o bucket: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}
