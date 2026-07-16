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

/** Fase de lançamento avaliada no cliente. null enquanto não montou. */
export function useLaunchPhase(): LaunchPhase | null {
  const now = useNow();
  return now ? getLaunchPhase(now) : null;
}
