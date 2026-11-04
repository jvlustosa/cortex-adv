"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import { MaterialCover } from "@/components/material-cover";
import { MaterialsGateModal } from "@/components/materials-gate-modal";
import {
  freeMaterialDownloadHref,
  type CourseMaterial,
} from "@/data/materiais";
import { formatBytes } from "@/lib/admin/format";
import { useIsLead } from "@/lib/waitlist/lead";

/**
 * Grade das apostilas. Sem lead, o clique abre o formulário; com lead, o link
 * baixa direto. O href real fica no anchor, então sem JS o download funciona.
 */
export function FreeMaterialsGrid({
  materials,
}: {
  materials: CourseMaterial[];
}) {
  const isLead = useIsLead();
  const [selected, setSelected] = useState<CourseMaterial | null>(null);

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {materials.map((material, index) => (
          <li
            key={material.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent)]/35"
          >
            <MaterialCover
              material={material}
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
              priority={index < 4}
              // No celular a capa inteira empurra o card pra fora da tela:
              // mostra só a faixa de cima, onde fica o título.
              className="aspect-[16/9] w-full border-b border-[var(--border)] sm:aspect-[480/679]"
            />

            <div className="flex flex-1 flex-col gap-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                {material.id} · {material.volume}
              </p>
              <h2 className="font-serif text-xl leading-snug text-[var(--foreground)]">
                {material.title}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {material.description}
              </p>

              <ul className="flex flex-col gap-1.5 text-sm text-[var(--foreground)]/85">
                {material.topics.map((topic) => (
                  <li key={topic} className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                      aria-hidden
                    />
                    {topic}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 pt-3">
                <p className="text-xs text-[var(--muted)]">
                  {material.pages} páginas · PDF
                  {material.sizeBytes
                    ? ` ${formatBytes(material.sizeBytes).replace(".", ",")}`
                    : null}
                </p>
                <a
                  href={freeMaterialDownloadHref(material.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
                  onClick={(event) => {
                    if (isLead) return;
                    event.preventDefault();
                    setSelected(material);
                  }}
                >
                  <Download className="size-4" aria-hidden />
                  Baixar grátis
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <MaterialsGateModal
        material={selected}
        total={materials.length}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
