import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import {
  MAX_MATERIAL_BYTES,
  MAX_MATERIAL_LABEL,
} from "@/lib/lessons/material-limits";
import { createMaterialUploadTicket } from "@/lib/lessons/materials";

/**
 * Assina o destino do upload. O browser manda os bytes direto pro Storage —
 * requisição nenhuma com o arquivo passa por aqui, então o teto de 4,5 MB da
 * Vercel não se aplica.
 */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: {
    moduleId?: string;
    lessonId?: string;
    fileName?: string;
    contentType?: string;
    sizeBytes?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const moduleId = String(body.moduleId ?? "").trim();
  const lessonId = String(body.lessonId ?? "").trim();
  const fileName = String(body.fileName ?? "").trim();

  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }
  if (!fileName) {
    return NextResponse.json(
      { error: "fileName é obrigatório." },
      { status: 400 },
    );
  }
  if (typeof body.sizeBytes === "number" && body.sizeBytes > MAX_MATERIAL_BYTES) {
    return NextResponse.json(
      { error: `Arquivo acima de ${MAX_MATERIAL_LABEL}. Comprima ou divida.` },
      { status: 413 },
    );
  }

  try {
    const ticket = await createMaterialUploadTicket({
      moduleId,
      lessonId,
      fileName,
      contentType: String(body.contentType ?? ""),
    });
    return NextResponse.json(ticket);
  } catch (err) {
    console.error("[api/admin/lessons/materials/upload-url POST]", err);
    return NextResponse.json(
      { error: `Não deu para preparar o upload: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}
