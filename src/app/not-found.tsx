import Link from "next/link";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <ClaudeAcademyBrand size="lg" href={null} className="flex-col items-center [&_div]:items-center" />
      <p className="mt-8 font-serif text-6xl tracking-tight text-[var(--foreground)]">
        404
      </p>
      <p className="mt-3 text-lg text-[var(--muted)]">
        Página não encontrada.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
