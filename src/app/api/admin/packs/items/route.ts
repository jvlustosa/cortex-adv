import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import {
  createPackItem,
  deletePackItem,
  listPackItemsForAdmin,
  parseSetupSteps,
  updatePackItem,
  type PackId,
  type PackItemKind,
  type PackItemStatus,
  type PackItemTier,
} from "@/lib/packs/items";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB (skills em zip)

function parsePackId(raw: string): PackId | null {
  return raw === "skills" || raw === "conectores" ? raw : null;
}

function parseKind(raw: string): PackItemKind | null {
  if (raw === "skill-file" || raw === "remote-connector" || raw === "lesson-ref") {
    return raw;
  }
  return null;
}

function parseStatus(raw: string): PackItemStatus {
  return raw === "teaser" ? "teaser" : "ready";
}

function parseTier(raw: string): PackItemTier {
  return raw === "amostra" ? "amostra" : "premium";
}

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const items = await listPackItemsForAdmin();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/admin/packs/items GET]", err);
    return NextResponse.json({ error: "Erro ao carregar galeria." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie os dados como multipart/form-data." },
      { status: 400 },
    );
  }

  const packId = parsePackId(String(formData.get("packId") ?? "").trim());
  const kind = parseKind(String(formData.get("kind") ?? "").trim());
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = parseStatus(String(formData.get("status") ?? "ready"));
  const tier = parseTier(String(formData.get("tier") ?? "premium"));
  const file = formData.get("file");
  const connectorUrl = String(formData.get("connectorUrl") ?? "").trim();
  const setupStepsRaw = String(formData.get("setupSteps") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "").trim();
  const lessonId = String(formData.get("lessonId") ?? "").trim();

  if (!packId) {
    return NextResponse.json({ error: "packId inválido." }, { status: 400 });
  }
  if (!kind) {
    return NextResponse.json({ error: "kind inválido." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  if (kind === "skill-file" && file instanceof File && file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 50 MB." }, { status: 413 });
  }

  try {
    const item = await createPackItem({
      packId,
      kind,
      name,
      description,
      status,
      tier,
      file: file instanceof File && file.size > 0 ? file : undefined,
      connectorUrl: connectorUrl || undefined,
      setupSteps: parseSetupSteps(setupStepsRaw),
      moduleId: moduleId || undefined,
      lessonId: lessonId || undefined,
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[api/admin/packs/items POST]", err);
    const message = err instanceof Error ? err.message : "Erro ao criar item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie os dados como multipart/form-data." },
      { status: 400 },
    );
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  const file = formData.get("file");
  if (file instanceof File && file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 50 MB." }, { status: 413 });
  }

  const patch: Parameters<typeof updatePackItem>[1] = {};
  if (formData.has("name")) patch.name = String(formData.get("name") ?? "");
  if (formData.has("description")) patch.description = String(formData.get("description") ?? "");
  if (formData.has("status")) patch.status = parseStatus(String(formData.get("status") ?? "ready"));
  if (formData.has("tier")) patch.tier = parseTier(String(formData.get("tier") ?? "premium"));
  if (formData.has("connectorUrl")) patch.connectorUrl = String(formData.get("connectorUrl") ?? "");
  if (formData.has("setupSteps")) {
    patch.setupSteps = parseSetupSteps(String(formData.get("setupSteps") ?? ""));
  }
  if (formData.has("moduleId")) patch.moduleId = String(formData.get("moduleId") ?? "");
  if (formData.has("lessonId")) patch.lessonId = String(formData.get("lessonId") ?? "");
  if (file instanceof File && file.size > 0) patch.file = file;

  try {
    const item = await updatePackItem(id, patch);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[api/admin/packs/items PATCH]", err);
    const message = err instanceof Error ? err.message : "Erro ao atualizar item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  try {
    await deletePackItem(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/packs/items DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir item." }, { status: 500 });
  }
}
