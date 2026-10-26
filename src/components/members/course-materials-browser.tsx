"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Check, Download, Search, X } from "lucide-react";
import {
  courseMaterialDownloadHref,
  filterMaterials,
  groupMaterialsByCategory,
  MATERIAL_CATEGORIES,
  type CourseMaterial,
  type MaterialCategoryId,
} from "@/data/materiais";
import { formatBytes } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import styles from "./course-materials-area.module.css";

type CourseMaterialsBrowserProps = {
  materials: CourseMaterial[];
};

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition";
const chipIdle =
  "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]";
const chipActive =
  "border-[var(--accent)]/50 bg-[var(--accent-dim)] text-[var(--accent)]";

/**
 * Busca + filtro por categoria dos Materiais Didáticos. Tudo no client: a
 * lista é pequena e estática, não precisa ir ao servidor a cada tecla.
 */
export function CourseMaterialsBrowser({
  materials,
}: CourseMaterialsBrowserProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategoryId | null>(null);

  const visible = filterMaterials(materials, { query, category });
  const groups = groupMaterialsByCategory(visible);
  // Só oferece categoria que tem apostila; o número reflete a busca atual.
  const chips = MATERIAL_CATEGORIES.filter((c) =>
    materials.some((m) => m.category === c.id),
  ).map((c) => ({
    ...c,
    count: filterMaterials(materials, { query, category: c.id }).length,
  }));
  const totalForQuery = filterMaterials(materials, { query }).length;
  const hasFilter = query.trim() !== "" || category !== null;

  function clearFilters() {
    setQuery("");
    setCategory(null);
  }

  let cardIndex = 0;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3">
        <label htmlFor={searchId} className="sr-only">
          Buscar apostila
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por tema, ex.: skills"
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pr-11 pl-11 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] transition hover:text-[var(--foreground)]"
              aria-label="Limpar busca"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por categoria"
        >
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={cn(chipClass, category === null ? chipActive : chipIdle)}
          >
            Todas
            <span className="opacity-70">{totalForQuery}</span>
          </button>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.id)}
              aria-pressed={category === chip.id}
              className={cn(
                chipClass,
                category === chip.id ? chipActive : chipIdle,
              )}
            >
              {chip.title}
              <span className="opacity-70">{chip.count}</span>
            </button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {visible.length === 1
            ? "1 apostila encontrada"
            : `${visible.length} apostilas encontradas`}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-[var(--muted)]">
            {hasFilter
              ? "Nenhuma apostila encontrada com esse filtro."
              : "As apostilas aparecem aqui assim que forem publicadas."}
          </p>
          {hasFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className={cn(chipClass, chipIdle)}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map(({ category: group, materials: items }) => (
            <section key={group.id} aria-labelledby={`categoria-${group.id}`}>
              <header className="mb-4 border-b border-[var(--border)] pb-3">
                <h2
                  id={`categoria-${group.id}`}
                  className="font-serif text-xl leading-snug text-[var(--foreground)]"
                >
                  {group.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {group.description}
                </p>
              </header>

              <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    priority={cardIndex++ < 4}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function MaterialCard({
  material,
  priority,
}: {
  material: CourseMaterial;
  priority: boolean;
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent)]/35">
      <Image
        src={material.cover}
        alt={`Capa da apostila ${material.id}: ${material.title}`}
        width={480}
        height={679}
        sizes="(min-width: 1024px) 15rem, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw"
        priority={priority}
        // Só a faixa de cima da capa, onde fica o título.
        className="aspect-[16/9] w-full border-b border-[var(--border)] object-cover object-top sm:aspect-[4/3]"
      />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
            {material.id} · {material.volume}
          </p>
          {material.exclusive ? (
            <span className={styles.exclusiveTag}>Exclusivo de alunos</span>
          ) : null}
        </div>
        <h3 className="font-serif text-base leading-snug text-[var(--foreground)]">
          {material.title}
        </h3>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {material.description}
        </p>

        <ul className="flex flex-col gap-1 text-xs text-[var(--foreground)]/85">
          {material.topics.map((topic) => (
            <li key={topic} className="flex gap-1.5">
              <Check
                className="mt-px size-3.5 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              {topic}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <p className="text-[0.7rem] text-[var(--muted)]">
            {material.pages} páginas · PDF
            {material.sizeBytes
              ? ` ${formatBytes(material.sizeBytes).replace(".", ",")}`
              : null}
          </p>
          <a
            href={courseMaterialDownloadHref(material.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
          >
            <Download className="size-3.5" aria-hidden />
            Baixar PDF
          </a>
        </div>
      </div>
    </li>
  );
}
