import {
  PACKS,
  type Pack,
  type PackItem,
  type PackItemTier,
} from "@/data/packs";
import {
  listPackItemsForMember,
  type PackItemMember,
} from "@/lib/packs/items";

function memberItemToPackItem(item: PackItemMember): PackItem {
  const base = {
    id: item.id,
    name: item.name,
    description: item.description,
    status: item.status,
    tier: item.tier,
  };

  switch (item.kind) {
    case "skill-file":
      return {
        ...base,
        kind: "skill-file",
        fileName: item.fileName ?? undefined,
        downloadUrl: item.downloadUrl,
        sizeBytes: item.sizeBytes,
      };
    case "remote-connector":
      return {
        ...base,
        kind: "remote-connector",
        connectorUrl: item.connectorUrl ?? "",
        setupSteps: item.setupSteps,
      };
    case "lesson-ref":
      return {
        ...base,
        kind: "lesson-ref",
        moduleId: item.moduleId ?? undefined,
        lessonId: item.lessonId ?? undefined,
      };
  }
}

/** Monta os packs a partir do DB; packs sem itens no DB mantêm o manifesto estático. */
export async function loadPacks(): Promise<Pack[]> {
  const dbItems = await listPackItemsForMember();
  if (dbItems.length === 0) return PACKS;

  const byPack = new Map<string, PackItem[]>();
  for (const item of dbItems) {
    const list = byPack.get(item.packId) ?? [];
    list.push(memberItemToPackItem(item));
    byPack.set(item.packId, list);
  }

  return PACKS.map((pack) => ({
    ...pack,
    items: byPack.has(pack.id) ? (byPack.get(pack.id) ?? []) : pack.items,
  }));
}

/** Item acessível se a galeria liberou ou se é amostra grátis. */
export function canAccessPackItem(
  tier: PackItemTier | undefined,
  galleryUnlocked: boolean,
): boolean {
  if (tier === "amostra") return true;
  return galleryUnlocked;
}
