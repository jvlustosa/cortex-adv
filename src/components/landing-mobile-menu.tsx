"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const linkClass =
  "flex min-h-11 items-center rounded-lg px-3 py-2.5 text-[15px] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]";

// Detecta o client sem setState-em-effect (false no SSR, true após hidratar).
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Menu mobile da landing. Os links do header são `sm:inline` (somem no mobile);
 * aqui eles ficam acessíveis via drawer. O painel é renderizado em portal porque
 * o `backdrop-filter` do header cria containing block e quebraria o `fixed`.
 */
export function LandingMobileMenu() {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--foreground)]/20 sm:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>

      {mounted
        ? createPortal(
            <div className="sm:hidden">
              {open ? (
                <button
                  type="button"
                  aria-label="Fechar menu"
                  className="fixed inset-0 z-40 bg-black/45"
                  onClick={close}
                />
              ) : null}

              <nav
                id={menuId}
                aria-label="Menu principal"
                inert={!open}
                className={cn(
                  "fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(18rem,88vw)] flex-col gap-1 border-l border-[var(--border)] bg-[var(--background)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.25rem+env(safe-area-inset-top,0px))] shadow-[-12px_0_40px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out",
                  open ? "translate-x-0" : "translate-x-full",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    Menu
                  </span>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Fechar menu"
                    onClick={close}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </div>

                <a href="#precos" onClick={close} className={linkClass}>
                  Preços
                </a>
                <Link href="/quiz" onClick={close} className={linkClass}>
                  Quiz
                </Link>
                <a href="#comunidade" onClick={close} className={linkClass}>
                  Comunidade
                </a>
                <Link href="/login" onClick={close} className={linkClass}>
                  Entrar
                </Link>

                <a
                  href="#lista-espera"
                  onClick={close}
                  className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
                >
                  Garantir vaga
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
