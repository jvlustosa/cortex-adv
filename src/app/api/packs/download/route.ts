import { NextResponse } from "next/server";
import { computePackAccess } from "@/lib/course/packs-access";
import { getPackItemRow, signPackItemDownload } from "@/lib/packs/items";
import { canDownloadPackItem } from "@/lib/packs/load-packs";
import {
  isDemoMode,
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

// Redirect assinado e por-usuário: nunca pode ser cacheado.
export const dynamic = "force-dynamic";

/**
 * Download de item da Galeria Premium. Assina no clique (o signed URL vive
 * segundos, não fica preso no HTML da página) e revalida o acesso aqui — a UI
 * esconder o botão não vale como trava.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Download indisponível." }, { status: 503 });
  }

  // Demo (localhost sem auth) enxerga a galeria liberada, igual à página.
  const demo = isDemoMode();
  let unlocked = demo;

  if (!demo) {
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
    unlocked = computePackAccess(user.created_at).isUnlocked;
  }

  const row = await getPackItemRow(id);
  if (!row) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }

  if (!canDownloadPackItem(row, unlocked)) {
    return NextResponse.json(
      { error: "Item ainda não liberado para sua conta." },
      { status: 403 },
    );
  }

  const signedUrl = await signPackItemDownload(row);
  if (!signedUrl) {
    return NextResponse.json(
      { error: "Arquivo indisponível. Avise o suporte." },
      { status: 502 },
    );
  }

  return NextResponse.redirect(signedUrl, 302);
}
