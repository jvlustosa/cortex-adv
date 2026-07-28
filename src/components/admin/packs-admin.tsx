"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { readApiErrorMessage } from "@/lib/errors/format";
import { adminFetch } from "@/lib/admin/client-fetch";
import { formatAdminDate, formatBytes } from "@/lib/admin/format";
import type {
  PackId,
  PackItemAdmin,
  PackItemKind,
  PackItemStatus,
  PackItemTier,
} from "@/lib/packs/items";
import { useConfirm } from "./confirm-dialog";
import { SectionLoading } from "./admin-ui";
import styles from "./admin-dashboard.module.css";

const PACK_LABELS: Record<PackId, string> = {
  skills: "Pack de Skills",
  conectores: "Pack de Conectores",
};

const KIND_LABELS: Record<PackItemKind, string> = {
  "skill-file": "Skill (.zip)",
  "remote-connector": "Conector remoto",
  "lesson-ref": "Link para aula",
};

type FormState = {
  packId: PackId;
  kind: PackItemKind;
  name: string;
  description: string;
  status: PackItemStatus;
  tier: PackItemTier;
  connectorUrl: string;
  setupSteps: string;
  moduleId: string;
  lessonId: string;
};

const EMPTY_FORM: FormState = {
  packId: "skills",
  kind: "skill-file",
  name: "",
  description: "",
  status: "ready",
  tier: "premium",
  connectorUrl: "",
  setupSteps: "",
  moduleId: "",
  lessonId: "",
};

export function PacksAdminPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PackItemAdmin[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/packs/items");
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Falha ao carregar galeria."));
      }
      const data = (await res.json()) as { items: PackItemAdmin[] };
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar galeria.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFile(null);
    setFileKey((k) => k + 1);
    setEditingId(null);
  }

  function startEdit(item: PackItemAdmin) {
    setEditingId(item.id);
    setForm({
      packId: item.packId,
      kind: item.kind,
      name: item.name,
      description: item.description,
      status: item.status,
      tier: item.tier,
      connectorUrl: item.connectorUrl ?? "",
      setupSteps: item.setupSteps.join("\n"),
      moduleId: item.moduleId ?? "",
      lessonId: item.lessonId ?? "",
    });
    setFile(null);
    setFileKey((k) => k + 1);
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    if (form.kind === "skill-file" && !editingId && !file) {
      toast.error("Selecione o arquivo .zip da skill.");
      return;
    }
    if (form.kind === "remote-connector" && !form.connectorUrl.trim()) {
      toast.error("URL do conector é obrigatória.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      if (editingId) fd.append("id", editingId);
      else {
        fd.append("packId", form.packId);
        fd.append("kind", form.kind);
      }
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("status", form.status);
      fd.append("tier", form.tier);
      if (form.kind === "remote-connector") {
        fd.append("connectorUrl", form.connectorUrl.trim());
        fd.append("setupSteps", form.setupSteps);
      }
      if (form.kind === "lesson-ref") {
        fd.append("moduleId", form.moduleId.trim());
        fd.append("lessonId", form.lessonId.trim());
      }
      if (file) fd.append("file", file);

      const res = await adminFetch("/api/admin/packs/items", {
        method: editingId ? "PATCH" : "POST",
        body: fd,
      });
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, editingId ? "Erro ao atualizar." : "Erro ao enviar."),
        );
      }
      const data = (await res.json()) as { item: PackItemAdmin };
      if (editingId) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? data.item : i)));
        toast.success("Item atualizado.");
      } else {
        setItems((prev) => [...prev, data.item]);
        toast.success("Item adicionado à galeria.");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteItem(item: PackItemAdmin) {
    const ok = await confirm({
      title: "Excluir item da galeria",
      message: `Excluir "${item.name}"? Alunos perdem acesso imediatamente.`,
    });
    if (!ok) return;

    setDeletingId(item.id);
    try {
      const res = await adminFetch("/api/admin/packs/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao excluir."));
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (editingId === item.id) resetForm();
      toast.success("Item removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <SectionLoading label="Carregando galeria…" />;
  }

  const grouped = (["skills", "conectores"] as PackId[]).map((packId) => ({
    packId,
    label: PACK_LABELS[packId],
    items: items.filter((i) => i.packId === packId),
  }));

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          {editingId ? "Editar item" : "Novo item na galeria"}
        </div>
        <div>
          {!editingId ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Pack</span>
                <select
                  className={`${styles.input} ${styles.select}`}
                  value={form.packId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      packId: e.target.value as PackId,
                      kind: e.target.value === "conectores" ? "remote-connector" : f.kind,
                    }))
                  }
                >
                  <option value="skills">Pack de Skills</option>
                  <option value="conectores">Pack de Conectores</option>
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Tipo</span>
                <select
                  className={`${styles.input} ${styles.select}`}
                  value={form.kind}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kind: e.target.value as PackItemKind }))
                  }
                >
                  {form.packId === "skills" ? (
                    <>
                      <option value="skill-file">Skill (.zip)</option>
                      <option value="lesson-ref">Link para aula</option>
                    </>
                  ) : (
                    <>
                      <option value="remote-connector">Conector remoto</option>
                      <option value="lesson-ref">Link para aula</option>
                    </>
                  )}
                </select>
              </label>
            </>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>Nome</span>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Triagem de caso"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Descrição</span>
            <textarea
              className={styles.textarea}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="O que o aluno ganha com este item"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Status</span>
            <select
              className={`${styles.input} ${styles.select}`}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as PackItemStatus }))
              }
            >
              <option value="ready">Pronto</option>
              <option value="teaser">Sendo preparado</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Acesso</span>
            <select
              className={`${styles.input} ${styles.select}`}
              value={form.tier}
              onChange={(e) =>
                setForm((f) => ({ ...f, tier: e.target.value as PackItemTier }))
              }
            >
              <option value="premium">Premium (após garantia)</option>
              <option value="amostra">Amostra grátis</option>
            </select>
          </label>

          {form.kind === "skill-file" ? (
            <label className={styles.field}>
              <span className={styles.label}>
                Arquivo .zip {editingId ? "(opcional — substitui o atual)" : ""}
              </span>
              <input
                key={fileKey}
                type="file"
                accept=".zip,application/zip"
                className={styles.input}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}

          {form.kind === "remote-connector" ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>URL do conector</span>
                <input
                  className={styles.input}
                  value={form.connectorUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, connectorUrl: e.target.value }))
                  }
                  placeholder="https://conector.exemplo.com/mcp"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Passos de setup (um por linha)</span>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={form.setupSteps}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, setupSteps: e.target.value }))
                  }
                  placeholder={"No Claude, abra Configurações → Conectores.\nCole a URL acima."}
                />
              </label>
            </>
          ) : null}

          {form.kind === "lesson-ref" ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Módulo (ID)</span>
                <input
                  className={styles.input}
                  value={form.moduleId}
                  onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
                  placeholder="skills"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Aula (ID)</span>
                <input
                  className={styles.input}
                  value={form.lessonId}
                  onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))}
                  placeholder="introducao-skills"
                />
              </label>
            </>
          ) : null}

          <div className={styles.actionsBar}>
              {editingId ? (
                <button type="button" className={styles.btnGhost} onClick={resetForm}>
                  Cancelar
                </button>
              ) : null}
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={uploading}
                onClick={() => void submit()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Enviando…
                  </>
                ) : editingId ? (
                  "Salvar alterações"
                ) : (
                  "Adicionar à galeria"
                )}
              </button>
            </div>
        </div>
      </section>

      {grouped.map(({ packId, label, items: packItems }) => (
        <section key={packId} className={styles.section}>
          <div className={styles.sectionHead}>
            {label}
            <span className={styles.feedbackMeta}> · {packItems.length} itens</span>
          </div>
          {packItems.length === 0 ? (
            <p className={styles.empty}>
              Nenhum item cadastrado. Itens do manifesto estático aparecem até você
              adicionar aqui.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Acesso</th>
                    <th>Status</th>
                    <th>Arquivo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {packItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <br />
                        <span className={styles.feedbackMeta}>{item.description}</span>
                      </td>
                      <td>{KIND_LABELS[item.kind]}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            item.tier === "amostra" ? styles.badgeOn : styles.badgeOff
                          }`}
                        >
                          {item.tier === "amostra" ? "Amostra" : "Premium"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            item.status === "ready" ? styles.badgeOn : styles.badgeOff
                          }`}
                        >
                          {item.status === "ready" ? "Pronto" : "Preparando"}
                        </span>
                      </td>
                      <td>
                        {item.fileName ? (
                          <>
                            {item.fileName}
                            {item.sizeBytes ? (
                              <span className={styles.feedbackMeta}>
                                {" "}
                                · {formatBytes(item.sizeBytes)}
                              </span>
                            ) : null}
                          </>
                        ) : item.connectorUrl ? (
                          <code className={styles.feedbackMeta}>{item.connectorUrl}</code>
                        ) : item.moduleId && item.lessonId ? (
                          <span className={styles.feedbackMeta}>
                            /aulas/{item.moduleId}/{item.lessonId}
                          </span>
                        ) : (
                          "—"
                        )}
                        <br />
                        <span className={styles.feedbackMeta}>
                          {formatAdminDate(item.createdAt ?? null)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => startEdit(item)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={styles.editBtn}
                            disabled={deletingId === item.id}
                            onClick={() => void deleteItem(item)}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="size-3.5" aria-hidden />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
