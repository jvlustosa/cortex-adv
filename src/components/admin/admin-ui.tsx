"use client";

import { useEffect, type ReactNode } from "react";
import styles from "./admin-dashboard.module.css";

export type AdminTab = "aulas" | "membros" | "convites" | "galeria";

export const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "aulas", label: "Gestão de aulas" },
  { id: "membros", label: "Gestão de membros" },
  { id: "convites", label: "Emissão de convites" },
  { id: "galeria", label: "Galeria Premium" },
];

export function AdminTabs({
  tab,
  onChange,
}: {
  tab: AdminTab;
  onChange: (tab: AdminTab) => void;
}) {
  return (
    <nav className={styles.tabs} aria-label="Seções do admin">
      {ADMIN_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`admin-tab-${item.id}`}
          aria-selected={tab === item.id}
          aria-controls={`admin-panel-${item.id}`}
          className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function AdminTabPanel({
  tabId,
  activeTab,
  children,
}: {
  tabId: AdminTab;
  activeTab: AdminTab;
  children: ReactNode;
}) {
  if (activeTab !== tabId) return null;
  return (
    <div
      role="tabpanel"
      id={`admin-panel-${tabId}`}
      aria-labelledby={`admin-tab-${tabId}`}
      className={styles.tabPanel}
    >
      {children}
    </div>
  );
}

export function ModalFormUndoKeys({
  active,
  onUndo,
}: {
  active: boolean;
  onUndo: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      if (e.shiftKey) return;
      e.preventDefault();
      onUndo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onUndo]);
  return null;
}

export function FormUndoBar({
  onDesfazer,
  canUndo,
  isDirty,
  children,
}: {
  onDesfazer: () => void;
  canUndo: boolean;
  isDirty: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.actionsBar}>
      <button
        type="button"
        className={styles.btnGhost}
        disabled={!canUndo && !isDirty}
        title="Desfazer (Ctrl+Z)"
        onClick={onDesfazer}
      >
        Desfazer
      </button>
      <div className={styles.actionsMain}>{children}</div>
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`Nota ${rating} de 5`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div
      className={styles.progressTrack}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progresso ${value}%`}
    >
      <div className={styles.progressFill} style={{ width: `${value}%` }} />
    </div>
  );
}

export function SectionLoading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className={styles.sectionLoading} role="status">
      <span className={styles.sectionLoadingSpinner} aria-hidden />
      {label}
    </div>
  );
}

export function BulkActionBar({
  count,
  onPublish,
  onUnpublish,
  onClear,
}: {
  count: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onClear: () => void;
}) {
  return (
    <div className={styles.bulkBar}>
      <span>{count} selecionada(s)</span>
      <button type="button" className={styles.editBtn} onClick={onPublish}>
        Publicar
      </button>
      <button type="button" className={styles.editBtn} onClick={onUnpublish}>
        Despublicar
      </button>
      <button type="button" className={styles.btnGhost} onClick={onClear}>
        Limpar
      </button>
    </div>
  );
}

export function LessonsTableHead({ selectMode = false }: { selectMode?: boolean }) {
  return (
    <div className={`${styles.tableWrap} ${styles.lessonsTableHead}`}>
      <table
        className={`${styles.table} ${styles.lessonsAdminTable}${
          selectMode ? "" : ` ${styles.lessonsAdminTableNoSelect}`
        }`}
      >
        <thead>
          <tr>
            {selectMode ? <th scope="col" aria-label="Selecionar" /> : null}
            <th scope="col">Aula</th>
            <th scope="col">Views</th>
            <th scope="col">Nota</th>
            <th scope="col">Status</th>
            <th scope="col">Vídeo</th>
            <th scope="col" aria-label="Ações" />
          </tr>
        </thead>
      </table>
    </div>
  );
}
