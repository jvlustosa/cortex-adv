"use client";

import { useSyncExternalStore } from "react";
import { getLaunchPhase, type LaunchPhase } from "@/lib/launch-window";

/**
 * Store externo do relógio, compartilhado por todos os consumidores (um só
 * timer). Server/pré-hidratação enxergam 0 → hook devolve null, então o HTML
 * estático bate com o primeiro render do cliente (sem mismatch). Depois de
 * montar, o valor vira a hora real e tica a cada 30s pra virar de fase sozinho.
 */
const TICK_MS = 30_000;

let currentTime = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (timer === null) {
    currentTime = Date.now();
    timer = setInterval(() => {
      currentTime = Date.now();
      for (const l of listeners) l();
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => currentTime;
const getServerSnapshot = () => 0;

/** Hora atual do cliente. null até montar. */
export function useNow(): Date | null {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return time === 0 ? null : new Date(time);
}

/**
 * Prévia por query param: `?preview=true|live|closed|before` força a fase pra
 * conferir como cada estado fica antes da hora. Só client-side; sem o param,
 * roda o horário real. Qualquer um com o link vê a prévia — não é gate de
 * acesso, só um atalho pra visualização.
 */
const PREVIEW_PHASES: Record<string, LaunchPhase> = {
  true: "live",
  live: "live",
  closed: "closed",
  before: "before",
};

function readPreviewPhase(): LaunchPhase | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("preview");
  return value ? (PREVIEW_PHASES[value.toLowerCase()] ?? null) : null;
}

export type LaunchState = {
  now: Date | null;
  phase: LaunchPhase | null;
  isPreview: boolean;
};

/** Estado de lançamento resolvido no cliente (respeita `?preview=`). */
export function useLaunchState(): LaunchState {
  const now = useNow();
  if (!now) return { now: null, phase: null, isPreview: false };

  const preview = readPreviewPhase();
  return {
    now,
    phase: preview ?? getLaunchPhase(now),
    isPreview: preview !== null,
  };
}

/** Fase de lançamento avaliada no cliente. null enquanto não montou. */
export function useLaunchPhase(): LaunchPhase | null {
  return useLaunchState().phase;
}
