import { NextResponse } from "next/server";
import { FREE_MATERIALS_BUCKET, findCourseMaterial } from "@/data/materiais";
import { assertProductApi } from "@/lib/course/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isDemoMode,
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const material = id ? findCourseMaterial(id) : undefined;
  if (!material) {
    return NextResponse.json(
      { error: "Material não encontrado." },
      { status: 404 },
    );
  }

  if (!isDemoMode()) {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const auth = await assertProductApi("curso");
    if ("error" in auth) return auth.error;
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
