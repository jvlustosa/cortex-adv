"use client";

import { ImageUp, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { adminFetch } from "@/lib/admin/client-fetch";
import { formatAdminDate, formatBytes } from "@/lib/admin/format";
import { readApiErrorMessage } from "@/lib/errors/format";
import {
  MAX_MATERIAL_BYTES,
  MAX_MATERIAL_LABEL,
} from "@/lib/lessons/material-limits";
import type {
  MaterialAdminRow,
  MaterialCategoryOption,
} from "@/lib/materials/admin-types";
import {
  COVER_ACCEPT,
  MAX_COVER_BYTES,
  coverExtension,
} from "@/lib/materials/catalog-rules";
import { useConfirm } from "./confirm-dialog";
import { SectionLoading } from "./admin-ui";
import styles from "./admin-dashboard.module.css";

type FormState = {
  title: string;
  volume: string;
  description: string;
  topics: string;
  pages: string;
  category: string;
  exclusive: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  volume: "",
  description: "",
  topics: "",
  pages: "",
  category: "",
  exclusive: true,
};

type UploadKind = "pdf" | "cover";

function checkPdf(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Envie o arquivo em PDF.";
  if (file.size > MAX_MATERIAL_BYTES) {
    return `Arquivo tem ${formatBytes(file.size)}. O limite é ${MAX_MATERIAL_LABEL}.`;
  }
  return null;
}

function checkCover(file: File): string | null {
  if (!coverExtension(file.name)) return "A capa precisa ser WebP, PNG ou JPG.";
  if (file.size > MAX_COVER_BYTES) {
    return `Capa tem ${formatBytes(file.size)}. O limite é 5 MB.`;
  }
  return null;
}

/**
 * Aba "Materiais Didáticos": cadastra, edita e exclui apostilas e envia o PDF
 * e a capa de cada uma. O cadastro fica em catalogo.json no bucket; apostila
 * sem PDF não aparece para o aluno. Passo a passo em docs/materiais-didaticos.md.
 */
export function MaterialsAdminPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MaterialAdminRow[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryOption[]>([]);
  /** null = formulário fechado; "new" = cadastro; id = edição. */
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);
  /** Apostila com upload ou exclusão em andamento. */
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/materials");
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, "Falha ao carregar as apostilas."),
        );
      }
      const data = (await res.json()) as {
        materials: MaterialAdminRow[];
        categories: MaterialCategoryOption[];
      };
      setRows(data.materials);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function closeForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNewPdf(null);
    setNewCover(null);
    setFileKey((k) => k + 1);
  }

  function startCreate() {
    closeForm();
    setForm({ ...EMPTY_FORM, category: categories[0]?.id ?? "" });
    setEditing("new");
  }

  function startEdit(row: MaterialAdminRow) {
    closeForm();
    setEditing(row.id);
    setForm({
      title: row.title,
      volume: row.volume,
      description: row.description,
      topics: row.topics.join("\n"),
      pages: String(row.pages),
      category: row.category,
      exclusive: row.exclusive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function replaceRow(row: MaterialAdminRow) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
  }

  /**
   * 1) Pede o destino assinado. 2) Manda o arquivo do browser direto pro
   * Storage, sem passar pelo teto de ~4,5 MB da Vercel. Devolve o caminho.
   */
  async function sendFile(id: string, kind: UploadKind, file: File): Promise<string> {
    const ticketRes = await adminFetch("/api/admin/materials/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        kind,
        fileName: file.name,
        sizeBytes: file.size,
      }),
    });
    if (!ticketRes.ok) {
      throw new Error(
        await readApiErrorMessage(ticketRes, "Erro ao preparar o upload."),
      );
    }
    const ticket = (await ticketRes.json()) as {
      signedUrl: string;
      contentType: string;
      path: string;
    };

    let put: Response;
    try {
      put = await fetch(ticket.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": ticket.contentType },
        body: file,
      });
    } catch (netErr) {
      throw new Error(
        `O arquivo não chegou no Storage — falha de rede ou bloqueio do navegador${
          netErr instanceof Error ? `: ${netErr.message}` : "."
        }`,
      );
    }
    if (!put.ok) {
      const detail = await put.text().catch(() => "");
      throw new Error(
        `O arquivo não subiu (HTTP ${put.status}). ${detail.slice(0, 300)}`.trim(),
      );
    }
    return ticket.path;
  }

  async function patchMaterial(body: Record<string, unknown>): Promise<MaterialAdminRow> {
    const res = await adminFetch("/api/admin/materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, "Erro ao salvar."));
    }
    return ((await res.json()) as { material: MaterialAdminRow }).material;
  }

  /** Sobe a capa e grava no cadastro; a capa anterior é apagada no servidor. */
  async function sendCover(id: string, file: File): Promise<MaterialAdminRow> {
    const path = await sendFile(id, "cover", file);
    return patchMaterial({ id, cover: path });
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("A descrição é obrigatória: é o que o aluno lê para escolher.");
      return;
    }
    const fileProblem =
      (newPdf && checkPdf(newPdf)) || (newCover && checkCover(newCover));
    if (fileProblem) {
      toast.error(fileProblem);
      return;
    }

    const payload = {
      title: form.title,
      volume: form.volume,
      description: form.description,
      topics: form.topics.split("\n"),
      pages: Number(form.pages),
      category: form.category,
      exclusive: form.exclusive,
    };

    setSaving(true);
    try {
      if (editing && editing !== "new") {
        replaceRow(await patchMaterial({ id: editing, ...payload }));
        toast.success("Apostila atualizada.");
        closeForm();
        return;
      }

      const res = await adminFetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao cadastrar."));
      }
      let created = ((await res.json()) as { material: MaterialAdminRow }).material;
      setRows((prev) => [...prev, created]);
      closeForm();

      // Cadastro já está salvo; se um arquivo falhar, dá para reenviar na linha.
      try {
        if (newCover) created = await sendCover(created.id, newCover);
        if (newPdf) await sendFile(created.id, "pdf", newPdf);
        toast.success(
          newPdf
            ? `Apostila ${created.id} cadastrada e no ar.`
            : `Apostila ${created.id} cadastrada. Envie o PDF para ela aparecer.`,
        );
      } catch (fileErr) {
        toast.error(
          `Apostila ${created.id} cadastrada, mas o arquivo falhou: ${
            fileErr instanceof Error ? fileErr.message : "erro no upload"
          }`,
        );
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(row: MaterialAdminRow, file: File) {
    const problem = checkPdf(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (row.stored) {
      const ok = await confirm({
        title: "Substituir PDF",
        message: `Trocar o PDF de "${row.title}"? Quem baixar a partir de agora recebe a versão nova.`,
        confirmLabel: "Substituir",
      });
      if (!ok) return;
    }

    setBusyId(row.id);
    try {
      await sendFile(row.id, "pdf", file);
      toast.success(`PDF de "${row.title}" enviado.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar o PDF.");
    } finally {
      setBusyId(null);
    }
  }

  async function uploadCover(row: MaterialAdminRow, file: File) {
    const problem = checkCover(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusyId(row.id);
    try {
      replaceRow(await sendCover(row.id, file));
      toast.success(`Capa de "${row.title}" atualizada.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar a capa.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: MaterialAdminRow) {
    const ok = await confirm({
      title: "Excluir apostila",
      message: `Excluir "${row.title}"? Ela sai do ar na hora e o PDF é apagado do bucket. Não dá para desfazer.`,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    setBusyId(row.id);
    try {
      const res = await adminFetch("/api/admin/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao excluir."));
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (editing === row.id) closeForm();
      toast.success(`"${row.title}" excluída.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <SectionLoading label="Carregando apostilas…" />;
  }

  const withPdf = rows.filter((r) => r.stored).length;
  const isNew = editing === "new";
  const locked = busyId !== null || saving;

  return (
    <>
      {editing ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            {isNew ? "Nova apostila" : `Editar apostila ${editing}`}
          </div>
          <div>
            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={form.title}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Projetos: o especialista que você constrói"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Volume (aparece em cima do título, ex.: &quot;Vol. 5&quot;,
                &quot;Masterclass&quot;)
              </span>
              <input
                className={styles.input}
                value={form.volume}
                maxLength={40}
                onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                placeholder="Vol. 5"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Categoria</span>
              <select
                className={`${styles.input} ${styles.select}`}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Acesso</span>
              <select
                className={`${styles.input} ${styles.select}`}
                value={form.exclusive ? "exclusiva" : "gratuita"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, exclusive: e.target.value === "exclusiva" }))
                }
              >
                <option value="exclusiva">Exclusiva de alunos</option>
                <option value="gratuita">Gratuita (também em /materiais, com cadastro de lead)</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Páginas</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                inputMode="numeric"
                value={form.pages}
                onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))}
                placeholder="12"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Descrição (uma ou duas frases: é o que o aluno lê para escolher)
              </span>
              <textarea
                className={styles.textarea}
                rows={3}
                maxLength={400}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Tópicos (um por linha, de 3 a 5; também entram na busca)
              </span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.topics}
                onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
                placeholder={"Primeiro assunto\nSegundo assunto\nTerceiro assunto"}
              />
            </label>

            {isNew ? (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>
                    PDF (opcional agora; sem ele a apostila não aparece para o aluno)
                  </span>
                  <input
                    key={`pdf-${fileKey}`}
                    type="file"
                    accept="application/pdf,.pdf"
                    className={styles.input}
                    onChange={(e) => setNewPdf(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    Capa (opcional; WebP, PNG ou JPG em pé, de preferência 480×679)
                  </span>
                  <input
                    key={`cover-${fileKey}`}
                    type="file"
                    accept={COVER_ACCEPT}
                    className={styles.input}
                    onChange={(e) => setNewCover(e.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            ) : null}

            <div className={styles.actionsBar}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={closeForm}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving}
                onClick={() => void submit()}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Salvando…
                  </>
                ) : isNew ? (
                  "Cadastrar apostila"
                ) : (
                  "Salvar alterações"
                )}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          Materiais Didáticos
          <span className={styles.feedbackMeta}>
            {withPdf} de {rows.length} com PDF
          </span>
          {!editing && !error ? (
            <button
              type="button"
              className={`${styles.editBtn} ml-auto`}
              onClick={startCreate}
            >
              <Plus className="size-3.5" aria-hidden />
              Nova apostila
            </button>
          ) : null}
        </div>
        <p className={`${styles.hint} px-[1.1rem] pt-3`}>
          A apostila só aparece para o aluno depois que o PDF sobe. As gratuitas
          aparecem também na página pública /materiais. Categoria nova entra por
          PR (src/data/materiais.ts). Passo a passo em docs/materiais-didaticos.md.
        </p>

        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>Nenhuma apostila cadastrada.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Apostila</th>
                  <th>Categoria</th>
                  <th>Acesso</th>
                  <th>PDF</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const busy = busyId === row.id;
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="flex items-start gap-3">
                          {row.coverSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element -- miniatura do painel, sem otimização
                            <img
                              src={row.coverSrc}
                              alt=""
                              className="h-14 w-10 shrink-0 rounded object-cover object-top"
                            />
                          ) : (
                            <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded border border-dashed border-[var(--border)] text-[0.6rem] text-[var(--muted)]">
                              sem capa
                            </span>
                          )}
                          <div>
                            <strong>
                              {row.id} · {row.title}
                            </strong>
                            <br />
                            <span className={styles.feedbackMeta}>
                              {row.volume ? `${row.volume} · ` : ""}
                              {row.pages} páginas
                            </span>
                            <br />
                            <code className={styles.feedbackMeta}>{row.filePath}</code>
                          </div>
                        </div>
                      </td>
                      <td>{row.categoryTitle}</td>
                      <td>{row.exclusive ? "Exclusiva" : "Gratuita"}</td>
                      <td>
                        {row.stored ? (
                          <>
                            <span className={`${styles.badge} ${styles.badgeOn}`}>
                              No ar
                            </span>
                            <br />
                            <span className={styles.feedbackMeta}>
                              {formatBytes(row.stored.size)} ·{" "}
                              {formatAdminDate(row.stored.updatedAt)}
                            </span>
                          </>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeOff}`}>
                            Falta o PDF
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            disabled={locked}
                            onClick={() => startEdit(row)}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Editar
                          </button>
                          <label className={styles.editBtn} aria-disabled={locked}>
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Upload className="size-3.5" aria-hidden />
                            )}
                            {row.stored ? "Trocar PDF" : "Enviar PDF"}
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              className="sr-only"
                              disabled={locked}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                // Limpa já: escolher o mesmo arquivo de novo
                                // precisa disparar onChange.
                                event.target.value = "";
                                if (file) void uploadPdf(row, file);
                              }}
                            />
                          </label>
                          <label className={styles.editBtn} aria-disabled={locked}>
                            <ImageUp className="size-3.5" aria-hidden />
                            {row.coverSrc ? "Trocar capa" : "Enviar capa"}
                            <input
                              type="file"
                              accept={COVER_ACCEPT}
                              className="sr-only"
                              disabled={locked}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) void uploadCover(row, file);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className={styles.editBtn}
                            disabled={locked}
                            aria-label={`Excluir ${row.title}`}
                            onClick={() => void remove(row)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
