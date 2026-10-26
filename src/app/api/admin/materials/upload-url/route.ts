import { NextResponse } from "next/server";
import { findCourseMaterial } from "@/data/materiais";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import {
  MAX_MATERIAL_BYTES,
  MAX_MATERIAL_LABEL,
} from "@/lib/lessons/material-limits";
import { createMaterialPdfUploadUrl } from "@/lib/materials/storage";

/**
 * Assina o upload do PDF de uma apostila do catálogo. O destino é sempre o
 * `filePath` cadastrado no código: o admin escolhe a apostila, não o caminho.
 */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { id?: string; fileName?: string; sizeBytes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const material = findCourseMaterial(String(body.id ?? "").trim());
  if (!material) {
    return NextResponse.json(
      { error: "Apostila não encontrada no catálogo." },
      { status: 404 },
    );
  }
  if (!String(body.fileName ?? "").toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Envie o arquivo em PDF." },
      { status: 400 },
    );
  }
  if (typeof body.sizeBytes === "number" && body.sizeBytes > MAX_MATERIAL_BYTES) {
    return NextResponse.json(
      { error: `Arquivo acima de ${MAX_MATERIAL_LABEL}. Comprima o PDF.` },
      { status: 413 },
    );
  }

  try {
    const signedUrl = await createMaterialPdfUploadUrl(material);
    return NextResponse.json({ signedUrl, contentType: "application/pdf" });
  } catch (err) {
    console.error("[api/admin/materials/upload-url POST]", err);
    return NextResponse.json(
      { error: `Não deu para preparar o upload: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}
