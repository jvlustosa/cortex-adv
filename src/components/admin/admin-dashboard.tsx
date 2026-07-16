"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { readApiErrorMessage } from "@/lib/errors/format";
import type { MemberAdminRow, MemberTotals } from "@/lib/admin/members";
import type { AdminTotals, LessonAdminRow } from "@/lib/lessons/types";
import { InviteWizard } from "./invite-wizard";
import styles from "./admin-dashboard.module.css";

type Tab = "aulas" | "membros" | "convites";

type FeedbackItem = {
  id: string;
  module_id: string;
  lesson_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  userEmail?: string | null;
  lessonTitle: string;
  moduleTitle: string;
};

type InviteItem = {
  id: string;
  token: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientTitle: "dr" | "dra" | null;
  signupUrl: string;
};

type EditState = LessonAdminRow | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "aulas", label: "Gestão de aulas" },
  { id: "membros", label: "Gestão de membros" },
  { id: "convites", label: "Emissão de convites" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`Nota ${rating} de 5`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.progressTrack} aria-hidden>
      <div className={styles.progressFill} style={{ width: `${value}%` }} />
    </div>
  );
}

/** URL pública do vídeo da aula. Tella tem prioridade (regra do player). */
function lessonVideo(
  lesson: LessonAdminRow,
): { url: string; label: string } | null {
  if (lesson.tella) {
    return { url: `https://www.tella.tv/video/${lesson.tella}`, label: "Tella" };
  }
  if (lesson.youtubeId) {
    return {
      url: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
      label: "YouTube",
    };
  }
  return null;
}

function VideoCell({
  lesson,
  onCopy,
}: {
  lesson: LessonAdminRow;
  onCopy: (text: string) => void;
}) {
  const video = lessonVideo(lesson);
  if (!video) return <span className={styles.feedbackMeta}>Sem vídeo</span>;

  return (
    <div className={styles.rowActions}>
      <a
        className={styles.editBtn}
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Preview ({video.label})
      </a>
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => onCopy(video.url)}
      >
        Copiar link
      </button>
    </div>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("aulas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonAdminRow[]>([]);
  const [lessonTotals, setLessonTotals] = useState<AdminTotals | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [editing, setEditing] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    duration: "",
    description: "",
    youtubeId: "",
    tella: "",
    published: true,
  });

  const [members, setMembers] = useState<MemberAdminRow[]>([]);
  const [memberTotals, setMemberTotals] = useState<MemberTotals | null>(null);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [resentAccess, setResentAccess] = useState<{
    email: string;
    url: string;
  } | null>(null);

  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [inviteResend, setInviteResend] = useState<{
    id: string;
    ok: boolean;
    message: string;
  } | null>(null);

  const loadLessons = useCallback(async () => {
    const [lessonsRes, feedbackRes] = await Promise.all([
      fetch("/api/admin/lessons"),
      fetch("/api/admin/feedback"),
    ]);

    if (!lessonsRes.ok) throw new Error("Falha ao carregar aulas.");
    if (!feedbackRes.ok) throw new Error("Falha ao carregar feedback.");

    const lessonsData = (await lessonsRes.json()) as {
      lessons: LessonAdminRow[];
      totals: AdminTotals;
    };
    const feedbackData = (await feedbackRes.json()) as {
      feedback: FeedbackItem[];
    };

    setLessons(lessonsData.lessons);
    setLessonTotals(lessonsData.totals);
    setFeedback(feedbackData.feedback);
  }, []);

  const loadMembers = useCallback(async () => {
    const res = await fetch("/api/admin/members");
    if (!res.ok) throw new Error("Falha ao carregar membros.");

    const data = (await res.json()) as {
      members: MemberAdminRow[];
      totals: MemberTotals;
    };

    setMembers(data.members);
    setMemberTotals(data.totals);
  }, []);

  const loadInvites = useCallback(async () => {
    const res = await fetch("/api/admin/invites");
    if (!res.ok) throw new Error("Falha ao carregar convites.");

    const data = (await res.json()) as { invites: InviteItem[] };
    setInvites(data.invites);
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "aulas") await loadLessons();
      if (tab === "membros") await loadMembers();
      if (tab === "convites") await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [tab, loadLessons, loadMembers, loadInvites]);

  useEffect(() => {
    void loadTab();
  }, [loadTab]);

  function openEdit(lesson: LessonAdminRow) {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      duration: lesson.duration,
      description: lesson.description,
      youtubeId: lesson.youtubeId ?? "",
      tella: lesson.tella ?? "",
      published: lesson.published,
    });
  }

  async function saveLesson() {
    if (!editing) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: editing.moduleId,
          lessonId: editing.lessonId,
          title: form.title,
          duration: form.duration,
          description: form.description,
          youtubeId: form.youtubeId.trim() || null,
          tella: form.tella.trim() || null,
          published: form.published,
        }),
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao salvar."));
      }

      setEditing(null);
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function resendInvite(invite: InviteItem) {
    setResendingId(invite.id);
    setInviteResend(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invite.id }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Erro ao reenviar convite.");
      }
      setInviteResend({ id: invite.id, ok: true, message: "E-mail reenviado." });
    } catch (err) {
      setInviteResend({
        id: invite.id,
        ok: false,
        message: err instanceof Error ? err.message : "Erro ao reenviar.",
      });
    } finally {
      setResendingId(null);
    }
  }

  async function toggleInvite(id: string, active: boolean) {
    setError(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar convite.");
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar convite.");
    }
  }

  async function resendAccess(member: MemberAdminRow) {
    setMemberActionId(member.id);
    setError(null);
    setResentAccess(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = (await res.json()) as { error?: string; magicLink?: string };
      if (!res.ok || !data.magicLink) {
        throw new Error(data.error ?? "Erro ao gerar link de acesso.");
      }
      await copyText(data.magicLink);
      setResentAccess({ email: member.email, url: data.magicLink });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar link de acesso.",
      );
    } finally {
      setMemberActionId(null);
    }
  }

  async function toggleBan(member: MemberAdminRow) {
    if (
      !member.banned &&
      !window.confirm(
        `Banir ${member.email}? O login fica bloqueado até você desbanir. Progresso e feedback são mantidos.`,
      )
    ) {
      return;
    }
    setMemberActionId(member.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, banned: !member.banned }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar membro.");
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar membro.");
    } finally {
      setMemberActionId(null);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Claude Academy</p>
          <h1 className={styles.title}>Painel admin</h1>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Seções do admin">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.loading}>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando…
        </p>
      ) : tab === "aulas" ? (
        <>
          {lessonTotals ? (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{lessonTotals.views}</div>
                <div className={styles.statLabel}>Views</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{lessonTotals.feedbacks}</div>
                <div className={styles.statLabel}>Feedbacks</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {lessonTotals.avgRating ?? "-"}
                </div>
                <div className={styles.statLabel}>Nota média</div>
              </div>
            </div>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHead}>Aulas do curso</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aula</th>
                    <th>Views</th>
                    <th>Nota</th>
                    <th>Status</th>
                    <th>Vídeo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={`${lesson.moduleId}:${lesson.lessonId}`}>
                      <td>
                        <strong>{lesson.title}</strong>
                        <br />
                        <span className={styles.feedbackMeta}>
                          {lesson.moduleTitle} · {lesson.lessonId}
                        </span>
                      </td>
                      <td>{lesson.viewCount}</td>
                      <td>
                        {lesson.avgRating !== null ? (
                          <>
                            <Stars rating={Math.round(lesson.avgRating)} />{" "}
                            <span className={styles.feedbackMeta}>
                              {lesson.avgRating} ({lesson.feedbackCount})
                            </span>
                          </>
                        ) : (
                          <span className={styles.feedbackMeta}>-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${lesson.published ? styles.badgeOn : styles.badgeOff}`}
                        >
                          {lesson.published ? "Publicada" : "Rascunho"}
                        </span>
                      </td>
                      <td>
                        <VideoCell lesson={lesson} onCopy={copyText} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => openEdit(lesson)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>Feedbacks recentes</div>
            {feedback.length === 0 ? (
              <p className={styles.empty}>Nenhum feedback ainda.</p>
            ) : (
              <div className={styles.feedbackList}>
                {feedback.map((item) => (
                  <article key={item.id} className={styles.feedbackItem}>
                    <div className={styles.feedbackTop}>
                      <div>
                        <p className={styles.feedbackLesson}>{item.lessonTitle}</p>
                        <p className={styles.feedbackMeta}>
                          {item.moduleTitle}
                          {item.userEmail ? ` · ${item.userEmail}` : ""} ·{" "}
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Stars rating={item.rating} />
                    </div>
                    {item.comment ? (
                      <p className={styles.feedbackComment}>{item.comment}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : tab === "membros" ? (
        <>
          {memberTotals ? (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{memberTotals.members}</div>
                <div className={styles.statLabel}>Membros</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {memberTotals.activeLast7Days}
                </div>
                <div className={styles.statLabel}>Ativos (7 dias)</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {memberTotals.avgProgressPercent}%
                </div>
                <div className={styles.statLabel}>Progresso médio</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{memberTotals.totalViews}</div>
                <div className={styles.statLabel}>Views totais</div>
              </div>
            </div>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHead}>Membros e uso</div>
            {resentAccess ? (
              <div className={styles.inviteCreated}>
                <p className={styles.feedbackMeta}>
                  Link de acesso de {resentAccess.email} (copiado):
                </p>
                <code className={styles.inviteUrl}>{resentAccess.url}</code>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => void copyText(resentAccess.url)}
                >
                  Copiar link
                </button>
              </div>
            ) : null}
            {members.length === 0 ? (
              <p className={styles.empty}>Nenhum membro cadastrado.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Membro</th>
                      <th>Progresso</th>
                      <th>Aulas vistas</th>
                      <th>Views</th>
                      <th>Feedbacks</th>
                      <th>Último acesso</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.email}</strong>
                          {member.banned ? (
                            <>
                              {" "}
                              <span
                                className={`${styles.badge} ${styles.badgeOff}`}
                              >
                                Banido
                              </span>
                            </>
                          ) : null}
                          <br />
                          <span className={styles.feedbackMeta}>
                            Cadastro · {formatDate(member.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.progressCell}>
                            <span className={styles.progressValue}>
                              {member.progressPercent}%
                            </span>
                            <ProgressBar value={member.progressPercent} />
                          </div>
                        </td>
                        <td>{member.uniqueLessonsViewed}</td>
                        <td>{member.totalViews}</td>
                        <td>
                          {member.feedbackCount > 0 ? (
                            <>
                              {member.feedbackCount}
                              {member.avgRatingGiven !== null ? (
                                <span className={styles.feedbackMeta}>
                                  {" "}
                                  · média {member.avgRatingGiven}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{formatDate(member.lastActiveAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              disabled={memberActionId === member.id}
                              onClick={() => void resendAccess(member)}
                            >
                              {memberActionId === member.id
                                ? "…"
                                : "Reenviar acesso"}
                            </button>
                            <button
                              type="button"
                              className={
                                member.banned ? styles.editBtn : styles.dangerBtn
                              }
                              disabled={memberActionId === member.id}
                              onClick={() => void toggleBan(member)}
                            >
                              {member.banned ? "Desbanir" : "Banir"}
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
        </>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHead}>Novo convite</div>
            <InviteWizard onCreated={loadInvites} />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>Convites emitidos</div>
            {invites.length === 0 ? (
              <p className={styles.empty}>Nenhum convite emitido.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Usos</th>
                      <th>Expira</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite.id}>
                        <td>
                          <strong>{invite.token}</strong>
                          <br />
                          <span className={styles.feedbackMeta}>
                            {invite.recipientName
                              ? `${invite.recipientName} · `
                              : ""}
                            {invite.label ?? "Sem rótulo"} ·{" "}
                            {formatDate(invite.createdAt)}
                          </span>
                        </td>
                        <td>
                          {invite.usedCount}/{invite.maxUses}
                        </td>
                        <td>{formatDate(invite.expiresAt)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${invite.active ? styles.badgeOn : styles.badgeOff}`}
                          >
                            {invite.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              onClick={() => void copyText(invite.signupUrl)}
                            >
                              Copiar
                            </button>
                            {invite.recipientEmail ? (
                              <button
                                type="button"
                                className={styles.editBtn}
                                disabled={resendingId === invite.id}
                                aria-busy={resendingId === invite.id}
                                onClick={() => void resendInvite(invite)}
                              >
                                {resendingId === invite.id ? (
                                  <>
                                    <Loader2
                                      className="size-3.5 animate-spin"
                                      aria-hidden
                                    />
                                    Enviando…
                                  </>
                                ) : (
                                  "Reenviar e-mail"
                                )}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={styles.editBtn}
                              onClick={() =>
                                void toggleInvite(invite.id, !invite.active)
                              }
                            >
                              {invite.active ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                          {inviteResend?.id === invite.id ? (
                            <p
                              className={`${styles.emailNote} ${
                                inviteResend.ok
                                  ? styles.emailNoteOk
                                  : styles.emailNoteWarn
                              }`}
                            >
                              {inviteResend.ok ? "✓ " : "⚠ "}
                              {inviteResend.message}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editing ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setEditing(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="edit-lesson-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-lesson-title" className={styles.modalTitle}>
              Editar aula
            </h2>
            <p className={styles.modalMeta}>
              {editing.moduleTitle} · {editing.lessonId}
            </p>

            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Duração</span>
              <input
                className={styles.input}
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tella (slug) — tem prioridade</span>
              <input
                className={styles.input}
                value={form.tella}
                placeholder="01-ca-1-o-que-e-o-claude-f528"
                onChange={(e) =>
                  setForm((f) => ({ ...f, tella: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>YouTube ID</span>
              <input
                className={styles.input}
                value={form.youtubeId}
                placeholder="dQw4w9WgXcQ"
                onChange={(e) =>
                  setForm((f) => ({ ...f, youtubeId: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Descrição</span>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
              />
              Publicada (visível no catálogo)
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving}
                aria-busy={saving}
                onClick={() => void saveLesson()}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Salvando…
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
