export type Orderable = {
  orderIndex: number | null;
  /** null para aulas criadas no painel (não existem no catálogo). */
  catalogIndex: number | null;
  title: string;
};

/** Ordem efetiva: order_index quando existe, senão a posição no catálogo. */
export function effectiveOrder(item: Orderable): number {
  if (item.orderIndex !== null) return item.orderIndex;
  if (item.catalogIndex !== null) return item.catalogIndex;
  return Number.MAX_SAFE_INTEGER; // custom sem order_index (não deveria ocorrer): fim
}

/** Comparador estável: ordem efetiva → catálogo antes de custom → título. */
export function compareLessons(a: Orderable, b: Orderable): number {
  const ea = effectiveOrder(a);
  const eb = effectiveOrder(b);
  if (ea !== eb) return ea - eb;
  const ca = a.catalogIndex === null ? 1 : 0;
  const cb = b.catalogIndex === null ? 1 : 0;
  if (ca !== cb) return ca - cb;
  return a.title.localeCompare(b.title);
}

/** Próximo order_index ao criar aula nova no módulo. */
export function nextOrderIndex(items: Orderable[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(effectiveOrder)) + 1;
}
