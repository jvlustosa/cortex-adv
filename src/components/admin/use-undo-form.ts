import { useCallback, useRef, useState } from "react";

function stableEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Form controlado com histórico local — Ctrl+Z / botão Desfazer funcionam de novo. */
export function useUndoForm<T>(initial: T) {
  const [value, setValueState] = useState(initial);
  const pastRef = useRef<T[]>([]);
  const baselineRef = useRef(initial);
  const [canStepUndo, setCanStepUndo] = useState(false);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (stableEqual(resolved, prev)) return prev;
      pastRef.current.push(prev);
      if (pastRef.current.length > 100) pastRef.current.shift();
      setCanStepUndo(true);
      return resolved;
    });
  }, []);

  const reset = useCallback((snap: T) => {
    pastRef.current = [];
    baselineRef.current = snap;
    setValueState(snap);
    setCanStepUndo(false);
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return false;
    const prev = past.pop()!;
    setValueState(prev);
    setCanStepUndo(pastRef.current.length > 0);
    return true;
  }, []);

  const revertToBaseline = useCallback(() => {
    reset(baselineRef.current);
  }, [reset]);

  const desfazer = useCallback(() => {
    if (undo()) return;
    if (!stableEqual(value, baselineRef.current)) revertToBaseline();
  }, [undo, revertToBaseline, value]);

  const isDirty = !stableEqual(value, baselineRef.current);

  return {
    value,
    setValue,
    reset,
    undo,
    revertToBaseline,
    desfazer,
    canStepUndo,
    isDirty,
  };
}
