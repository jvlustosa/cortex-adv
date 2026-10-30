import { NextResponse } from "next/server";
import {
  COVER_CONTENT_TYPES,
  COVER_FOLDER,
  isCoverFileName,
} from "@/lib/materials/catalog-rules";
import { downloadCover } from "@/lib/materials/storage";
import {
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

/**
 * Capas enviadas pelo /admin. O bucket é privado (guarda os PDFs), então a
 * imagem passa por aqui. O nome do arquivo muda a cada troca de capa, por
 * isso o cache pode ser longo.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!isCoverFileName(file)) {
    return NextResponse.json({ error: "Capa não encontrada." }, { status: 404 });
  }
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Capa indisponível." }, { status: 503 });
  }

  try {
    const blob = await downloadCover(`${COVER_FOLDER}/${file}`);
    if (!blob) {
      return NextResponse.json({ error: "Capa não encontrada." }, { status: 404 });
    }
    const ext = file.split(".").pop() ?? "";
    return new NextResponse(blob, {
      headers: {
        "Content-Type": COVER_CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[api/materiais/capa] falha ao ler a capa", { file, err });
    return NextResponse.json({ error: "Capa indisponível." }, { status: 502 });
  }
}
