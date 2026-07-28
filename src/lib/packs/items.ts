import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

export const PACK_ITEMS_BUCKET = "pack-items";
const SIGNED_URL_TTL_SECONDS = 300;

export type PackItemKind = "skill-file" | "remote-connector" | "lesson-ref";
export type PackItemStatus = "ready" | "teaser";
export type PackItemTier = "premium" | "amostra";
export type PackId = "skills" | "conectores";

export type PackItemRow = {
  id: string;
  pack_id: PackId;
  kind: PackItemKind;
  name: string;
  description: string;
  status: PackItemStatus;
  tier: PackItemTier;
  file_path: string | null;
  file_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  connector_url: string | null;
  setup_steps: string[];
  module_id: string | null;
  lesson_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PackItemAdmin = {
  id: string;
  packId: PackId;
  kind: PackItemKind;
  name: string;
  description: string;
  status: PackItemStatus;
  tier: PackItemTier;
  fileName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  connectorUrl: string | null;
  setupSteps: string[];
  moduleId: string | null;
  lessonId: string | null;
  sortOrder: number;
  createdAt?: string;
};

export type PackItemMember = PackItemAdmin & {
  downloadUrl: string | null;
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  zip: "application/zip",
  md: "text/markdown",
  markdown: "text/markdown",
  html: "text/html",
  txt: "text/plain",
  pdf: "application/pdf",
};

function inferContentType(fileName: string, provided: string): string {
  if (provided && provided !== "application/octet-stream") return provided;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? provided ?? "application/octet-stream";
}

function safeFileName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "arquivo";
}

function rowToAdmin(row: PackItemRow): PackItemAdmin {
  return {
    id: row.id,
    packId: row.pack_id,
    kind: row.kind,
    name: row.name,
    description: row.description,
    status: row.status,
    tier: row.tier,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    connectorUrl: row.connector_url,
    setupSteps: Array.isArray(row.setup_steps) ? row.setup_steps : [],
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function parseSetupSteps(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Lista todos os itens da galeria para o admin. */
export async function listPackItemsForAdmin(): Promise<PackItemAdmin[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pack_items")
    .select("*")
    .order("pack_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as PackItemRow[]).map(rowToAdmin);
}

/** Lista itens com signed URL para alunos autenticados. */
export async function listPackItemsForMember(): Promise<PackItemMember[]> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pack_items")
      .select("*")
      .order("pack_id", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const items: PackItemMember[] = [];
    for (const row of (data ?? []) as PackItemRow[]) {
      const base = rowToAdmin(row);
      let downloadUrl: string | null = null;

      if (row.kind === "skill-file" && row.file_path && row.file_name) {
        const { data: signed } = await admin.storage
          .from(PACK_ITEMS_BUCKET)
          .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS, {
            download: row.file_name,
          });
        downloadUrl = signed?.signedUrl ?? null;
      }

      items.push({ ...base, downloadUrl });
    }
    return items;
  } catch (err) {
    console.error("[packs] list member items", err);
    return [];
  }
}

export async function createPackItem(input: {
  packId: PackId;
  kind: PackItemKind;
  name: string;
  description: string;
  status: PackItemStatus;
  tier: PackItemTier;
  file?: File;
  connectorUrl?: string;
  setupSteps?: string[];
  moduleId?: string;
  lessonId?: string;
}): Promise<PackItemAdmin> {
  const admin = createAdminClient();

  if (input.kind === "skill-file" && (!input.file || input.file.size === 0)) {
    throw new Error("Arquivo é obrigatório para skill.");
  }
  if (input.kind === "remote-connector" && !input.connectorUrl?.trim()) {
    throw new Error("URL do conector é obrigatória.");
  }

  const { data: last } = await admin
    .from("pack_items")
    .select("sort_order")
    .eq("pack_id", input.packId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? -1) + 1;

  let filePath: string | null = null;
  let fileName: string | null = null;
  let contentType: string | null = null;
  let sizeBytes: number | null = null;

  if (input.kind === "skill-file" && input.file) {
    fileName = input.file.name || "skill.zip";
    contentType = inferContentType(fileName, input.file.type);
    const buffer = Buffer.from(await input.file.arrayBuffer());
    filePath = `${input.packId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
    sizeBytes = input.file.size;

    const { error: uploadError } = await admin.storage
      .from(PACK_ITEMS_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: false });
    if (uploadError) throw uploadError;
  }

  const { data, error } = await admin
    .from("pack_items")
    .insert({
      pack_id: input.packId,
      kind: input.kind,
      name: input.name.trim(),
      description: input.description.trim(),
      status: input.status,
      tier: input.tier,
      file_path: filePath,
      file_name: fileName,
      content_type: contentType,
      size_bytes: sizeBytes,
      connector_url: input.connectorUrl?.trim() || null,
      setup_steps: input.setupSteps ?? [],
      module_id: input.moduleId?.trim() || null,
      lesson_id: input.lessonId?.trim() || null,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (error) {
    if (filePath) {
      await admin.storage.from(PACK_ITEMS_BUCKET).remove([filePath]);
    }
    throw error;
  }

  return rowToAdmin(data as PackItemRow);
}

export async function updatePackItem(
  id: string,
  patch: {
    name?: string;
    description?: string;
    status?: PackItemStatus;
    tier?: PackItemTier;
    connectorUrl?: string;
    setupSteps?: string[];
    moduleId?: string;
    lessonId?: string;
    file?: File;
  },
): Promise<PackItemAdmin> {
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("pack_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Item não encontrado.");

  const row = existing as PackItemRow;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.description !== undefined) updates.description = patch.description.trim();
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.tier !== undefined) updates.tier = patch.tier;
  if (patch.connectorUrl !== undefined) updates.connector_url = patch.connectorUrl.trim() || null;
  if (patch.setupSteps !== undefined) updates.setup_steps = patch.setupSteps;
  if (patch.moduleId !== undefined) updates.module_id = patch.moduleId.trim() || null;
  if (patch.lessonId !== undefined) updates.lesson_id = patch.lessonId.trim() || null;

  if (patch.file && row.kind === "skill-file") {
    const fileName = patch.file.name || "skill.zip";
    const contentType = inferContentType(fileName, patch.file.type);
    const buffer = Buffer.from(await patch.file.arrayBuffer());
    const filePath = `${row.pack_id}/${crypto.randomUUID()}-${safeFileName(fileName)}`;

    const { error: uploadError } = await admin.storage
      .from(PACK_ITEMS_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    if (row.file_path) {
      await admin.storage.from(PACK_ITEMS_BUCKET).remove([row.file_path]);
    }

    updates.file_path = filePath;
    updates.file_name = fileName;
    updates.content_type = contentType;
    updates.size_bytes = patch.file.size;
  }

  const { data, error } = await admin
    .from("pack_items")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToAdmin(data as PackItemRow);
}

export async function deletePackItem(id: string): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("pack_items")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;

  const filePath = (data as { file_path: string | null }).file_path;
  if (filePath) {
    await admin.storage.from(PACK_ITEMS_BUCKET).remove([filePath]);
  }

  const { error: delError } = await admin.from("pack_items").delete().eq("id", id);
  if (delError) throw delError;
}
