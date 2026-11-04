import Image from "next/image";
import { FileText } from "lucide-react";
import { materialCoverSrc } from "@/lib/materials/catalog-rules";
import { cn } from "@/lib/utils";

type MaterialCoverProps = {
  material: { id: string; title: string; cover: string };
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Capa da apostila nos cards. Apostila cadastrada pelo admin pode ainda estar
 * sem capa: aí entra um bloco neutro com o título, no mesmo recorte.
 */
export function MaterialCover({
  material,
  sizes,
  priority,
  className,
}: MaterialCoverProps) {
  const src = materialCoverSrc(material.cover);

  if (!src) {
    return (
      <div
        className={cn(
          "flex flex-col items-start justify-end gap-2 bg-[var(--accent-dim)] p-5",
          className,
        )}
        aria-hidden
      >
        <FileText className="size-6 text-[var(--accent)]" />
        <span className="font-serif text-lg leading-snug text-[var(--foreground)]">
          {material.title}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`Capa da apostila ${material.id}: ${material.title}`}
      width={480}
      height={679}
      sizes={sizes}
      priority={priority}
      className={cn("object-cover object-top", className)}
    />
  );
}
