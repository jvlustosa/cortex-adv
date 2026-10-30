import { NextResponse } from "next/server";
import { FREE_MATERIALS_BUCKET, findFreeMaterial } from "@/data/materiais";
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
  const material = id ? findFreeMaterial(id) : undefined;
  if (!material) {
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
