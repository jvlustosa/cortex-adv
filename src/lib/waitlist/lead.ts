"use client";

import { useSyncExternalStore } from "react";

/**
 * Mesma chave do popup do site (chatjuridico.com.br). Quem já entregou os dados
 * lá não é gateado de novo aqui — e vice-versa.
 */
export const LEAD_KEY = "cj_claude_academy_lead";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key === LEAD_KEY) notify();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(LEAD_KEY) === "1";
  } catch {
    return false;
  }
}

const getServerSnapshot = () => false;

export function useIsLead(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Marca o lead e acorda quem depende disso na mesma tela — o QR da /grupo
 * precisa desborrar no instante em que o modal do botão ao lado é enviado.
 */
export function markLead() {
  try {
    localStorage.setItem(LEAD_KEY, "1");
  } catch {
    /* ignore */
  }
  notify();
}
