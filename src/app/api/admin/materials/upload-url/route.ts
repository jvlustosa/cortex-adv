import { NextResponse } from "next/server";
import type { CourseMaterial } from "@/data/materiais";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { formatErrorDetail } from "@/lib/errors/format";
import {
  MAX_MATERIAL_BYTES,
  MAX_MATERIAL_LABEL,
} from "@/lib/lessons/material-limits";
import {
  COVER_CONTENT_TYPES,
  MAX_COVER_BYTES,
  coverExtension,
  coverStoragePath,
} from "@/lib/materials/catalog-rules";
import {
  createMaterialUploadUrl,
  findCatalogMaterial,
} from "@/lib/materials/storage";

/**
 * Assina o upload do PDF ou da capa de uma apostila do catálogo. O destino é
 * decidido aqui: o PDF vai sempre para o `filePath` cadastrado; a capa ganha
 * um nome novo em `capas/`, que o painel grava com PATCH depois do upload.
 */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { id?: string; kind?: string; fileName?: string; sizeBytes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const kind = body.kind === "cover" ? "cover" : "pdf";
  const fileName = String(body.fileName ?? "");

  let material: CourseMaterial | undefined;
  try {
    material = await findCatalogMaterial(String(body.id ?? "").trim());
  } catch (err) {
    console.error("[api/admin/materials/upload-url POST]", err);
    return NextResponse.json(
      { error: `Não deu para ler o catálogo: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
  if (!material) {
    return NextResponse.json(
      { error: "Apostila não encontrada no catálogo." },
      { status: 404 },
    );
  }

  let path: string;
  let contentType: string;
  if (kind === "pdf") {
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Envie o arquivo em PDF." }, { status: 400 });
    }
    if (typeof body.sizeBytes === "number" && body.sizeBytes > MAX_MATERIAL_BYTES) {
      return NextResponse.json(
        { error: `Arquivo acima de ${MAX_MATERIAL_LABEL}. Comprima o PDF.` },
        { status: 413 },
      );
    }
    path = material.filePath;
    contentType = "application/pdf";
  } else {
    const ext = coverExtension(fileName);
    if (!ext) {
      return NextResponse.json(
        { error: "A capa precisa ser WebP, PNG ou JPG." },
        { status: 400 },
      );
    }
    if (typeof body.sizeBytes === "number" && body.sizeBytes > MAX_COVER_BYTES) {
      return NextResponse.json(
        { error: "Capa acima de 5 MB. Use uma imagem menor." },
        { status: 413 },
      );
    }
    path = coverStoragePath(material.id, ext);
    contentType = COVER_CONTENT_TYPES[ext];
  }

  try {
    const signedUrl = await createMaterialUploadUrl(path);
    return NextResponse.json({ signedUrl, contentType, path });
  } catch (err) {
    console.error("[api/admin/materials/upload-url POST]", err);
    return NextResponse.json(
      { error: `Não deu para preparar o upload: ${formatErrorDetail(err)}` },
      { status: 500 },
    );
  }
}
