import { NextResponse } from "next/server";
import { FREE_MATERIALS_BUCKET, type CourseMaterial } from "@/data/materiais";
import { findCatalogMaterial } from "@/lib/materials/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

// Cada clique gera um signed URL novo: o redirect nunca pode ser cacheado.
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Download das apostilas gratuitas. O gate de lead é só no client (mesma régua
 * do grupo aberto); aqui a trava é outra: o arquivo fica em bucket privado e o
 * link assinado expira em segundos, então quem quer o PDF passa pela página
 * em vez de circular um link direto do Storage.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  let material: CourseMaterial | undefined;
  try {
    material = id ? await findCatalogMaterial(id) : undefined;
  } catch (err) {
    console.error("[api/materiais/download] catálogo indisponível", err);
    return NextResponse.json(
      { error: "Arquivo indisponível. Tente de novo em instantes." },
      { status: 502 },
    );
  }
  // Exclusiva de aluno nunca sai por esta rota, que não pede login.
  if (!material || material.exclusive) {
    return NextResponse.json(
      { error: "Material não encontrado." },
      { status: 404 },
    );
  }

  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) {
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
    console.error("[api/materiais/download] sign failed", {
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
