"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
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

type LessonFeedbackDetail = {
  avg: number | null;
  count: number;
  items: {
    rating: number;
    comment: string | null;
    userEmail: string | null;
    createdAt: string;
  }[];
};

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

/** URL de embed pro player inline (mesma regra do lado membro). */
function lessonEmbedUrl(lesson: LessonAdminRow): string | null {
  if (lesson.tella) {
    return `https://www.tella.tv/video/${lesson.tella}/embed?b=0&title=0&a=0`;
  }
  if (lesson.youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`;
  }
  return null;
}

type LessonGroup = {
  moduleId: string;
  moduleTitle: string;
  lessons: LessonAdminRow[];
};

/** Agrupa aulas por módulo preservando a ordem que o backend já entregou. */
function groupByModule(lessons: LessonAdminRow[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  for (const lesson of lessons) {
    let g = groups.find((x) => x.moduleId === lesson.moduleId);
    if (!g) {
      g = {
        moduleId: lesson.moduleId,
        moduleTitle: lesson.moduleTitle,
        lessons: [],
      };
      groups.push(g);
    }
    g.lessons.push(lesson);
  }
  return groups;
}

function VideoCell({
  lesson,
  onCopy,
  onPreview,
}: {
  lesson: LessonAdminRow;
  onCopy: (text: string) => void;
  onPreview: (l: LessonAdminRow) => void;
}) {
  const video = lessonVideo(lesson);
  if (!video) return <span className={styles.feedbackMeta}>Sem vídeo</span>;

  return (
    <div className={styles.rowActions}>
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => onPreview(lesson)}
      >
        Preview ({video.label})
      </button>
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => onCopy(video.url)}
      >
        Copiar link
      </button>
      <a
        className={styles.editBtn}
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir
      </a>
    </div>
  );
}

function LessonRow({
  lesson,
  onCopy,
  onEdit,
  onPreview,
  onFeedback,
  onDelete,
}: {
  lesson: LessonAdminRow;
  onCopy: (text: string) => void;
  onEdit: (l: LessonAdminRow) => void;
  onPreview: (l: LessonAdminRow) => void;
  onFeedback: (l: LessonAdminRow) => void;
  onDelete: (l: LessonAdminRow) => void;
}) {
  return (
    <tr className={styles.lessonRow}>
      <td>
        <strong>{lesson.title}</strong>
        <br />
        <span className={styles.feedbackMeta}>
          {lesson.moduleTitle} · {lesson.lessonId}
        </span>
        {lesson.origin === "custom" ? (
          <span className={styles.customBadge}>criada no painel</span>
        ) : null}
      </td>
      <td>{lesson.viewCount}</td>
      <td>
        <div className={styles.notaCell}>
          <span>
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
          </span>
          <button
            type="button"
            className={styles.hoverIcon}
            onClick={() => onFeedback(lesson)}
            aria-label={`Ver avaliações de ${lesson.title}`}
          >
            <MessageSquare className="size-4" aria-hidden />
          </button>
        </div>
      </td>
      <td>
        <span
          className={`${styles.badge} ${lesson.published ? styles.badgeOn : styles.badgeOff}`}
        >
          {lesson.published ? "Publicada" : "Rascunho"}
        </span>
      </td>
      <td>
        <VideoCell lesson={lesson} onCopy={onCopy} onPreview={onPreview} />
      </td>
      <td>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => onEdit(lesson)}
          >
            Editar
          </button>
          {lesson.origin === "custom" ? (
            <button
              type="button"
              className={styles.iconDangerBtn}
              onClick={() => onDelete(lesson)}
              aria-label={`Excluir ${lesson.title}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function PreviewModal({
  lesson,
  onClose,
}: {
  lesson: LessonAdminRow;
  onClose: () => void;
}) {
  const url = lessonEmbedUrl(lesson);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modalWide}
        role="dialog"
        aria-label={`Preview: ${lesson.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{lesson.title}</h2>
          <button
            type="button"
            className={styles.editBtn}
            onClick={onClose}
            aria-label="Fechar preview"
          >
            Fechar
          </button>
        </div>
        {url ? (
          <div className={styles.playerWrap}>
            <iframe
              src={url}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.player}
            />
          </div>
        ) : (
          <p className={styles.empty}>Sem vídeo configurado.</p>
        )}
      </div>
    </div>
  );
}

function FeedbackModal({
  lesson,
  detail,
  loading,
  onClose,
}: {
  lesson: LessonAdminRow;
  detail: LessonFeedbackDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-label={`Avaliações: ${lesson.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Avaliações · {lesson.title}</h2>
          <button
            type="button"
            className={styles.editBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : !detail || detail.count === 0 ? (
          <p className={styles.empty}>Sem avaliações ainda.</p>
        ) : (
          <>
            <p className={styles.modalMeta}>
              Média {detail.avg ?? "-"} · {detail.count}{" "}
              {detail.count === 1 ? "avaliação" : "avaliações"}
            </p>
            <div className={styles.feedbackList}>
              {detail.items.map((it, i) => (
                <article key={i} className={styles.feedbackItem}>
                  <div className={styles.feedbackTop}>
                    <span className={styles.feedbackMeta}>
                      {it.userEmail ?? "anônimo"} · {formatDate(it.createdAt)}
                    </span>
                    <Stars rating={it.rating} />
                  </div>
                  {it.comment ? (
                    <p className={styles.feedbackComment}>{it.comment}</p>
                  ) : (
                    <p className={styles.feedbackMeta}>(sem comentário)</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
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
  const [previewLesson, setPreviewLesson] = useState<LessonAdminRow | null>(
    null,
  );
  const [feedbackLesson, setFeedbackLesson] = useState<LessonAdminRow | null>(
    null,
  );
  const [feedbackDetail, setFeedbackDetail] =
    useState<LessonFeedbackDetail | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    duration: "",
    description: "",
    youtubeId: "",
    tella: "",
    published: true,
  });
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    moduleId: "",
    title: "",
    duration: "",
    description: "",
    youtubeId: "",
    tella: "",
    published: false,
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

  const openFeedback = useCallback(async (lesson: LessonAdminRow) => {
    setFeedbackLesson(lesson);
    setFeedbackDetail(null);
    setFeedbackLoading(true);
    try {
      const res = await fetch(
        `/api/admin/lessons/feedback?moduleId=${encodeURIComponent(lesson.moduleId)}&lessonId=${encodeURIComponent(lesson.lessonId)}`,
      );
      if (!res.ok) throw new Error("Falha ao carregar avaliações.");
      setFeedbackDetail((await res.json()) as LessonFeedbackDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar avaliações.");
      setFeedbackLesson(null);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

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

  const moduleOptions = groupByModule(lessons).map((g) => ({
    id: g.moduleId,
    title: g.moduleTitle,
  }));

  function openCreate() {
    setCreateForm({
      moduleId: moduleOptions[0]?.id ?? "",
      title: "",
      duration: "",
      description: "",
      youtubeId: "",
      tella: "",
      published: false,
    });
    setCreating(true);
  }

  async function saveNewLesson() {
    if (!createForm.moduleId || !createForm.title.trim()) {
      setError("Módulo e título são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: createForm.moduleId,
          title: createForm.title.trim(),
          duration: createForm.duration.trim() || null,
          description: createForm.description.trim() || null,
          youtubeId: createForm.youtubeId.trim() || null,
          tella: createForm.tella.trim() || null,
          published: createForm.published,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao criar aula."));
      }
      setCreating(false);
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar aula.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(lesson: LessonAdminRow) {
    if (
      !window.confirm(
        `Excluir "${lesson.title}"? Isso remove a aula e suas avaliações. Ação irreversível.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: lesson.moduleId,
          lessonId: lesson.lessonId,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao excluir."));
      }
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
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
            <div className={styles.sectionHead}>
              <span>Aulas do curso</span>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={openCreate}
              >
                Adicionar aula
              </button>
            </div>
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
                  {groupByModule(lessons).map((group) => (
                    <Fragment key={group.moduleId}>
                      <tr className={styles.moduleRow}>
                        <td colSpan={6}>{group.moduleTitle}</td>
                      </tr>
                      {group.lessons.map((lesson) => (
                        <LessonRow
                          key={`${lesson.moduleId}:${lesson.lessonId}`}
                          lesson={lesson}
                          onCopy={copyText}
                          onEdit={openEdit}
                          onPreview={setPreviewLesson}
                          onFeedback={openFeedback}
                          onDelete={deleteLesson}
                        />
                      ))}
                    </Fragment>
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

      {previewLesson ? (
        <PreviewModal
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
        />
      ) : null}

      {feedbackLesson ? (
        <FeedbackModal
          lesson={feedbackLesson}
          detail={feedbackDetail}
          loading={feedbackLoading}
          onClose={() => setFeedbackLesson(null)}
        />
      ) : null}

      {creating ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setCreating(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="create-lesson-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-lesson-title" className={styles.modalTitle}>
              Adicionar aula
            </h2>

            <label className={styles.field}>
              <span className={styles.label}>Módulo</span>
              <select
                className={styles.input}
                value={createForm.moduleId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, moduleId: e.target.value }))
                }
              >
                {moduleOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Duração</span>
              <input
                className={styles.input}
                value={createForm.duration}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, duration: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tella (slug) — tem prioridade</span>
              <input
                className={styles.input}
                value={createForm.tella}
                placeholder="01-ca-1-o-que-e-o-claude-f528"
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, tella: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>YouTube ID</span>
              <input
                className={styles.input}
                value={createForm.youtubeId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, youtubeId: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Descrição</span>
              <textarea
                className={styles.textarea}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={createForm.published}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, published: e.target.checked }))
                }
              />
              Publicar já (senão fica como rascunho)
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving}
                aria-busy={saving}
                onClick={() => void saveNewLesson()}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />{" "}
                    Criando…
                  </>
                ) : (
                  "Criar aula"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
