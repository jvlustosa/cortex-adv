import { NextResponse } from "next/server";
import { FREE_MATERIALS_BUCKET, findCourseMaterial } from "@/data/materiais";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isDemoMode,
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

// Cada clique gera um signed URL novo: o redirect nunca pode ser cacheado.
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Download dos Materiais Didáticos da área de membros. Diferente de
 * /api/materiais/download (só as gratuitas, gate de lead no client), aqui
 * entram também as apostilas exclusivas, então a trava é a sessão: sem aluno
 * logado, 401. O arquivo segue em bucket privado com link que expira em
 * segundos.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const material = id ? findCourseMaterial(id) : undefined;
  if (!material) {
    return NextResponse.json(
      { error: "Material não encontrado." },
      { status: 404 },
    );
  }

  // Demo (localhost sem auth) enxerga a área de membros, igual às páginas.
  if (!isDemoMode()) {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Download indisponível." },
      { status: 503 },
    );
  }

  const { data, error } = await createAdminClient()
    .storage.from(FREE_MATERIALS_BUCKET)
    .createSignedUrl(material.filePath, SIGNED_URL_TTL_SECONDS, {
      download: material.fileName,
    });

  if (error || !data?.signedUrl) {
    console.error("[api/materiais/alunos/download] sign failed", {
      id: material.id,
      message: error?.message,
    });
    return NextResponse.json(
      { error: "Arquivo indisponível. Tente de novo em instantes." },
      { status: 502 },
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}
