"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { readApiErrorMessage } from "@/lib/errors/format";
import {
  defaultSeasonCover,
  SEASON_COVER_IMAGES,
} from "@/lib/course/module-covers";
import type { MemberAdminRow, MemberTotals } from "@/lib/admin/members";
import { formatAdminDate, formatBytes } from "@/lib/admin/format";
import {
  resolveDropTarget,
  type DropPosition,
} from "@/lib/admin/dnd";
import { lessonMoveBounds } from "@/lib/admin/lesson-move-bounds";
import {
  normalizeSection,
  type SectionAdminRow,
} from "@/lib/admin/normalize-section";
import type { LessonMaterialAdmin } from "@/lib/lessons/materials";
import {
  adjacentModuleId,
  buildLessonGroups,
  groupByModule,
  insertLessonAt,
  lessonIdsForModule,
} from "@/lib/lessons/admin-grouping";
import { lessonEmbedUrl } from "@/lib/lessons/video-urls";
import type { AdminTotals, LessonAdminRow } from "@/lib/lessons/types";
import { DragHandle, ReorderButtons } from "./admin-dnd";
import {
  AdminTabPanel,
  AdminTabs,
  BulkActionBar,
  FormUndoBar,
  LessonsTableHead,
  ModalFormUndoKeys,
  ProgressBar,
  SectionLoading,
  Stars,
  type AdminTab,
} from "./admin-ui";
import { LessonRow } from "./lessons-table";
import { InviteWizard } from "./invite-wizard";
import { useUndoForm } from "./use-undo-form";
import styles from "./admin-dashboard.module.css";

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

type LessonFormState = {
  title: string;
  duration: string;
  description: string;
  youtubeId: string;
  tella: string;
  published: boolean;
};

type CreateLessonFormState = LessonFormState & { moduleId: string };

type SectionFormState = {
  title: string;
  description: string;
  thumbnailGradient: string;
  coverImage: string;
  unlockAfterDays: number;
  published: boolean;
  comingSoon: boolean;
};

const EMPTY_LESSON_FORM: LessonFormState = {
  title: "",
  duration: "",
  description: "",
  youtubeId: "",
  tella: "",
  published: true,
};

const EMPTY_CREATE_FORM: CreateLessonFormState = {
  ...EMPTY_LESSON_FORM,
  moduleId: "",
  published: false,
};

const EMPTY_SECTION_FORM: SectionFormState = {
  title: "",
  description: "",
  thumbnailGradient: "",
  coverImage: "",
  unlockAfterDays: 0,
  published: true,
  comingSoon: false,
};

function CoverImagePicker({
  value,
  onChange,
  seasonIndex,
}: {
  value: string;
  onChange: (url: string) => void;
  seasonIndex: number;
}) {
  return (
    <div className={styles.coverPicker}>
      <div className={styles.coverPreviewWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value || defaultSeasonCover(seasonIndex)}
          alt=""
          className={styles.coverPreview}
        />
      </div>
      <input
        className={styles.input}
        value={value}
        placeholder={defaultSeasonCover(seasonIndex)}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className={styles.coverGrid} role="listbox" aria-label="Capas disponíveis">
        {SEASON_COVER_IMAGES.map((src) => (
          <button
            key={src}
            type="button"
            role="option"
            aria-selected={value === src}
            className={`${styles.coverThumb} ${value === src ? styles.coverThumbActive : ""}`}
            onClick={() => onChange(src)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
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
                      {it.userEmail ?? "anônimo"} · {formatAdminDate(it.createdAt)}
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

function MaterialsModal({
  lesson,
  materials,
  loading,
  uploading,
  deletingId,
  onUpload,
  onDelete,
  onClose,
}: {
  lesson: LessonAdminRow;
  materials: LessonMaterialAdmin[];
  loading: boolean;
  uploading: boolean;
  deletingId: string | null;
  onUpload: (label: string, file: File) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  // Chave pra resetar o <input type="file"> após um upload bem-sucedido.
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (!file) return;
    onUpload(label.trim() || file.name, file);
    setLabel("");
    setFile(null);
    setFileKey((k) => k + 1);
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-label={`Materiais: ${lesson.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Materiais · {lesson.title}</h2>
          <button
            type="button"
            className={styles.editBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>
        <p className={styles.modalMeta}>
          Skills, PDFs e templates que o aluno baixa dentro da aula.
        </p>

        {loading ? (
          <p className={styles.loading}>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : materials.length === 0 ? (
          <p className={styles.empty}>Nenhum material ainda.</p>
        ) : (
          <div className={styles.feedbackList}>
            {materials.map((m) => (
              <article key={m.id} className={styles.feedbackItem}>
                <div className={styles.feedbackTop}>
                  <div>
                    <p className={styles.feedbackLesson}>{m.label}</p>
                    <p className={styles.feedbackMeta}>
                      {m.fileName}
                      {m.sizeBytes ? ` · ${formatBytes(m.sizeBytes)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.iconDangerBtn}
                    disabled={deletingId === m.id}
                    aria-label={`Excluir ${m.label}`}
                    onClick={() => onDelete(m.id)}
                  >
                    {deletingId === m.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Rótulo (opcional)</span>
          <input
            className={styles.input}
            value={label}
            placeholder="Ex.: Skill de petição inicial"
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Arquivo</span>
          <input
            key={fileKey}
            className={styles.input}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={!file || uploading}
            aria-busy={uploading}
            onClick={submit}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Enviando…
              </>
            ) : (
              "Adicionar material"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ dbMode = false }: { dbMode?: boolean }) {
  const toast = useToast();
  const [tab, setTab] = useState<AdminTab>("aulas");
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

  // Materiais da aula (skills/PDFs) — upload/exclusão no painel.
  const [materialsLesson, setMaterialsLesson] = useState<LessonAdminRow | null>(
    null,
  );
  const [materials, setMaterials] = useState<LessonMaterialAdmin[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialDeletingId, setMaterialDeletingId] = useState<string | null>(
    null,
  );

  // Seções (módulos) — geridas só no modo DB (COURSE_SOURCE=db).
  const [sections, setSections] = useState<SectionAdminRow[]>([]);
  const [creatingSection, setCreatingSection] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const lessonForm = useUndoForm(EMPTY_LESSON_FORM);
  const createFormCtrl = useUndoForm(EMPTY_CREATE_FORM);
  const sectionFormCtrl = useUndoForm(EMPTY_SECTION_FORM);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDragKey, setSectionDragKey] = useState<string | null>(null);
  const [sectionDropHint, setSectionDropHint] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [lessonDropHint, setLessonDropHint] = useState<{
    key: string;
    position: DropPosition;
  } | null>(null);
  const [moduleDropHover, setModuleDropHover] = useState<string | null>(null);

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
      modules?: SectionAdminRow[];
    };
    const feedbackData = (await feedbackRes.json()) as {
      feedback: FeedbackItem[];
    };

    setLessons(lessonsData.lessons);
    setLessonTotals(lessonsData.totals);
    setFeedback(feedbackData.feedback);
    setSelected(new Set());

    if (lessonsData.modules?.length) {
      setSections(lessonsData.modules.map(normalizeSection));
    } else if (dbMode) {
      const modulesRes = await fetch("/api/admin/modules");
      if (modulesRes.ok) {
        const data = (await modulesRes.json()) as { modules: SectionAdminRow[] };
        setSections(data.modules.map(normalizeSection));
      }
    }
  }, [dbMode]);

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
    lessonForm.reset({
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

  const openMaterials = useCallback(async (lesson: LessonAdminRow) => {
    setMaterialsLesson(lesson);
    setMaterials([]);
    setMaterialsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/lessons/materials?moduleId=${encodeURIComponent(lesson.moduleId)}&lessonId=${encodeURIComponent(lesson.lessonId)}`,
      );
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, "Falha ao carregar materiais."),
        );
      }
      const data = (await res.json()) as { materials: LessonMaterialAdmin[] };
      setMaterials(data.materials);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar materiais.",
      );
      setMaterialsLesson(null);
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  async function uploadMaterial(label: string, file: File) {
    if (!materialsLesson) return;
    setMaterialUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("moduleId", materialsLesson.moduleId);
      fd.append("lessonId", materialsLesson.lessonId);
      fd.append("label", label);
      fd.append("file", file);
      const res = await fetch("/api/admin/lessons/materials", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao subir material."));
      }
      const data = (await res.json()) as { material: LessonMaterialAdmin };
      setMaterials((prev) => [...prev, data.material]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao subir material.");
    } finally {
      setMaterialUploading(false);
    }
  }

  async function deleteMaterial(id: string) {
    setMaterialDeletingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/lessons/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, "Erro ao excluir material."),
        );
      }
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir material.");
    } finally {
      setMaterialDeletingId(null);
    }
  }

  async function saveLesson() {
    if (!editing) return;
    const form = lessonForm.value;
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

  const moduleOptions = (() => {
    if (sections.length > 0) {
      return [...sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ id: s.moduleId, title: s.title }));
    }
    return groupByModule(lessons).map((g) => ({
      id: g.moduleId,
      title: g.moduleTitle,
    }));
  })();

  function openCreateInModule(moduleId: string) {
    createFormCtrl.reset({
      ...EMPTY_CREATE_FORM,
      moduleId,
    });
    setCreating(true);
  }

  function openCreate() {
    createFormCtrl.reset({
      ...EMPTY_CREATE_FORM,
      moduleId: moduleOptions[0]?.id ?? "",
    });
    setCreating(true);
  }

  function openCreateSection() {
    const nextIndex = sections.length;
    sectionFormCtrl.reset({
      ...EMPTY_SECTION_FORM,
      coverImage: defaultSeasonCover(nextIndex),
    });
    setEditingSectionId(null);
    setCreatingSection(true);
  }

  function openEditSection(section: SectionAdminRow) {
    sectionFormCtrl.reset({
      title: section.title,
      description: section.description,
      thumbnailGradient: section.thumbnailGradient,
      coverImage: section.coverImage ?? "",
      unlockAfterDays: section.unlockAfterDays,
      published: section.published,
      comingSoon: section.comingSoon,
    });
    setEditingSectionId(section.moduleId);
    setCreatingSection(true);
  }

  async function saveNewSection() {
    const sectionForm = sectionFormCtrl.value;
    if (!sectionForm.title.trim()) {
      setError("Título da seção é obrigatório.");
      return;
    }
    setSavingSection(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionForm.title.trim(),
          description: sectionForm.description.trim() || null,
          thumbnailGradient: sectionForm.thumbnailGradient.trim() || null,
          coverImage: sectionForm.coverImage.trim() || null,
          unlockAfterDays: sectionForm.unlockAfterDays || 0,
          published: sectionForm.published,
          comingSoon: sectionForm.comingSoon,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao criar seção."));
      }
      setCreatingSection(false);
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar seção.");
    } finally {
      setSavingSection(false);
    }
  }

  async function saveEditSection() {
    const sectionForm = sectionFormCtrl.value;
    if (!editingSectionId || !sectionForm.title.trim()) {
      setError("Título da seção é obrigatório.");
      return;
    }
    setSavingSection(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: editingSectionId,
          title: sectionForm.title.trim(),
          description: sectionForm.description.trim() || null,
          thumbnailGradient: sectionForm.thumbnailGradient.trim() || null,
          coverImage: sectionForm.coverImage.trim() || null,
          unlockAfterDays: sectionForm.unlockAfterDays || 0,
          published: sectionForm.published,
          comingSoon: sectionForm.comingSoon,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao salvar seção."));
      }
      setCreatingSection(false);
      setEditingSectionId(null);
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar seção.");
    } finally {
      setSavingSection(false);
    }
  }

  async function deleteSection(section: SectionAdminRow) {
    if (
      !window.confirm(
        `Excluir a seção "${section.title}"? Isso remove a seção e suas ${section.lessonCount} aula(s), com views e avaliações. Ação irreversível.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/admin/modules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: section.moduleId }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao excluir seção."));
      }
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir seção.");
    }
  }

  async function persistSectionOrder(ordered: SectionAdminRow[]) {
    const snapshot = sections;
    try {
      const res = await fetch("/api/admin/modules/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ordered.map((s) => s.moduleId) }),
      });
      if (!res.ok) throw new Error("reorder falhou");
    } catch {
      setSections(snapshot); // rollback otimista
      setError("Não consegui salvar a nova ordem das seções. Revertido.");
      return;
    }
    // Ordem salva: ressincroniza "Aulas do curso" + dropdown de criar aula, que
    // também agrupam por módulo na ordem do backend. Falha aqui não desfaz a
    // ordem (já persistida) — a próxima navegação reconcilia.
    try {
      await loadLessons();
    } catch {
      /* ordem já salva no banco; segue com o estado otimista */
    }
  }

  function reorderSections(fromSlug: string, toSlug: string) {
    const from = sections.findIndex((s) => s.moduleId === fromSlug);
    const to = sections.findIndex((s) => s.moduleId === toSlug);
    if (from < 0 || to < 0 || from === to) return;
    const next = sections.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSections(next);
    void persistSectionOrder(next);
  }

  function handleSectionDrop(targetSlug: string) {
    if (!sectionDragKey) return;
    const from = sectionDragKey;
    clearSectionDrag();
    reorderSections(from, targetSlug);
  }

  function moveSectionByKeyboard(section: SectionAdminRow, dir: -1 | 1) {
    const idx = sections.findIndex((s) => s.moduleId === section.moduleId);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    reorderSections(section.moduleId, sections[targetIdx].moduleId);
  }

  async function saveNewLesson() {
    const createForm = createFormCtrl.value;
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

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleModuleSelected(keys: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  }

  async function bulkPublish(published: boolean) {
    if (selected.size === 0) return;
    const keys = Array.from(selected).map((k) => {
      const [moduleId, lessonId] = k.split(":");
      return { moduleId, lessonId };
    });
    setError(null);
    try {
      const res = await fetch("/api/admin/lessons/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys, published }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro no lote."));
      }
      await loadLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no lote.");
    }
  }

  async function persistOrder(moduleId: string, ordered: LessonAdminRow[]) {
    const lessonIds = lessonIdsForModule(ordered, moduleId);
    const snapshot = lessons;
    try {
      const res = await fetch("/api/admin/lessons/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, lessonIds }),
      });
      if (!res.ok) throw new Error("reorder falhou");
    } catch {
      setLessons(snapshot);
      setError("Não consegui salvar a nova ordem. Revertido.");
    }
  }

  async function persistMove(
    fromModuleId: string,
    lessonId: string,
    toModuleId: string,
    beforeLessonId: string | null,
    optimistic: LessonAdminRow[],
  ) {
    const snapshot = lessons;
    setLessons(optimistic);
    try {
      const res = await fetch("/api/admin/lessons/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromModuleId,
          lessonId,
          toModuleId,
          beforeLessonId,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erro ao mover aula."));
      }
    } catch (err) {
      setLessons(snapshot);
      setError(
        err instanceof Error ? err.message : "Não consegui mover a aula.",
      );
    }
  }

  function moduleTitleFor(moduleId: string): string {
    return (
      sections.find((s) => s.moduleId === moduleId)?.title ??
      lessons.find((l) => l.moduleId === moduleId)?.moduleTitle ??
      moduleId
    );
  }

  function applyLessonMove(
    lesson: LessonAdminRow,
    toModuleId: string,
    targetKey: string | null,
  ) {
    const optimistic = insertLessonAt(
      lessons,
      lesson,
      toModuleId,
      targetKey,
      moduleTitleFor(toModuleId),
    );
    if (lesson.moduleId === toModuleId) {
      setLessons(optimistic);
      void persistOrder(toModuleId, optimistic);
      return;
    }
    if (!dbMode) {
      setError("Mover entre módulos exige COURSE_SOURCE=db.");
      return;
    }
    const beforeLessonId = targetKey ? targetKey.split(":")[1] : null;
    void persistMove(
      lesson.moduleId,
      lesson.lessonId,
      toModuleId,
      beforeLessonId,
      optimistic,
    );
  }

  function clearLessonDrag() {
    setDragKey(null);
    setLessonDropHint(null);
    setModuleDropHover(null);
  }

  function clearSectionDrag() {
    setSectionDragKey(null);
    setSectionDropHint(null);
  }

  function handleDrop(
    targetModuleId: string,
    targetKey: string,
    position: DropPosition = "before",
  ) {
    if (!dragKey) return;
    if (dragKey === targetKey) {
      clearLessonDrag();
      return;
    }
    const dragged = lessons.find(
      (l) => `${l.moduleId}:${l.lessonId}` === dragKey,
    );
    if (!dragged) {
      clearLessonDrag();
      return;
    }
    applyLessonMove(
      dragged,
      targetModuleId,
      resolveDropTarget(lessonGroups, targetModuleId, targetKey, position),
    );
    clearLessonDrag();
  }

  function handleLessonDragOver(key: string, position: DropPosition) {
    if (!dragKey || dragKey === key) return;
    setLessonDropHint((prev) =>
      prev?.key === key && prev.position === position ? prev : { key, position },
    );
  }

  function handleModuleHeaderDrop(targetModuleId: string) {
    if (!dragKey || !dbMode) return;
    const dragged = lessons.find(
      (l) => `${l.moduleId}:${l.lessonId}` === dragKey,
    );
    if (!dragged || dragged.moduleId === targetModuleId) {
      clearLessonDrag();
      return;
    }
    applyLessonMove(dragged, targetModuleId, null);
    clearLessonDrag();
  }

  function moveByKeyboard(lesson: LessonAdminRow, dir: -1 | 1) {
    const key = `${lesson.moduleId}:${lesson.lessonId}`;
    const modLessons = lessons.filter((l) => l.moduleId === lesson.moduleId);
    const idx = modLessons.findIndex(
      (l) => `${l.moduleId}:${l.lessonId}` === key,
    );

    if (dir === -1 && idx === 0 && dbMode) {
      const prevModule = adjacentModuleId(lessons, lesson.moduleId, -1);
      if (prevModule) {
        applyLessonMove(lesson, prevModule, null);
        return;
      }
    }
    if (dir === 1 && idx === modLessons.length - 1 && dbMode) {
      const nextModule = adjacentModuleId(lessons, lesson.moduleId, 1);
      if (nextModule) {
        const first = lessons.find((l) => l.moduleId === nextModule);
        const targetKey = first
          ? `${first.moduleId}:${first.lessonId}`
          : null;
        applyLessonMove(lesson, nextModule, targetKey);
        return;
      }
    }

    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= modLessons.length) return;
    const targetKey = `${modLessons[targetIdx].moduleId}:${modLessons[targetIdx].lessonId}`;
    applyLessonMove(lesson, lesson.moduleId, targetKey);
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
      toast.success("Copiado.");
    } catch {
      toast.error("Não consegui copiar.");
    }
  }

  const lessonGroups = buildLessonGroups(lessons, sections, dbMode);
  const hasLessonRows = lessonGroups.some((g) => g.lessons.length > 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Claude Academy</p>
          <h1 className={styles.title}>Painel admin</h1>
        </div>
      </header>

      <AdminTabs tab={tab} onChange={setTab} />

      {error ? <p className={styles.error}>{error}</p> : null}

      <AdminTabPanel tabId="aulas" activeTab={tab}>
        {loading ? (
          <SectionLoading label="Carregando aulas…" />
        ) : (
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

          {dbMode ? (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span>Módulos e aulas</span>
                <div className={styles.headActions}>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    aria-pressed={selectMode}
                    onClick={() => {
                      setSelectMode((on) => {
                        if (on) setSelected(new Set());
                        return !on;
                      });
                    }}
                  >
                    {selectMode ? "Sair da seleção" : "Selecionar"}
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={openCreate}
                  >
                    Adicionar aula
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={openCreateSection}
                  >
                    Criar seção
                  </button>
                </div>
              </div>
              {selectMode && selected.size > 0 ? (
                <BulkActionBar
                  count={selected.size}
                  onPublish={() => void bulkPublish(true)}
                  onUnpublish={() => void bulkPublish(false)}
                  onClear={() => setSelected(new Set())}
                />
              ) : null}
              <p className={styles.hint}>
                Segure ⋮⋮ para arrastar. Solte entre aulas para reordenar ou no
                cabeçalho de outro módulo para mover.
              </p>
              {hasLessonRows ? <LessonsTableHead /> : null}
              <div className={styles.moduleList}>
                {lessonGroups.length === 0 ? (
                  <p className={styles.empty}>
                    Nenhum módulo ainda.{" "}
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={openCreateSection}
                    >
                      Criar seção
                    </button>
                  </p>
                ) : (
                  lessonGroups.map((group, gIdx) => {
                    const section = sections.find(
                      (s) => s.moduleId === group.moduleId,
                    );
                    const coverSrc =
                      section?.coverImage ??
                      defaultSeasonCover(section?.sortOrder ?? gIdx);
                    return (
                      <article
                        key={group.moduleId}
                        className={`${styles.modulePanel}${
                          moduleDropHover === group.moduleId && dragKey
                            ? ` ${styles.modulePanelDropHover}`
                            : ""
                        }${
                          sectionDragKey === section?.moduleId
                            ? ` ${styles.modulePanelDragging}`
                            : ""
                        }`}
                        onDragOver={(e) => {
                          if (!dragKey) return;
                          e.preventDefault();
                          setModuleDropHover(group.moduleId);
                        }}
                        onDragLeave={(e) => {
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node) &&
                            moduleDropHover === group.moduleId
                          ) {
                            setModuleDropHover(null);
                          }
                        }}
                        onDrop={() => handleModuleHeaderDrop(group.moduleId)}
                      >
                        <header
                          className={`${styles.modulePanelHead}${
                            sectionDropHint === section?.moduleId
                              ? ` ${styles.modulePanelHeadDropHint}`
                              : ""
                          }${
                            moduleDropHover === group.moduleId && dragKey
                              ? ` ${styles.modulePanelHeadDropActive}`
                              : ""
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragKey) {
                              setModuleDropHover(group.moduleId);
                              return;
                            }
                            if (
                              sectionDragKey &&
                              section &&
                              sectionDragKey !== section.moduleId
                            ) {
                              setSectionDropHint(section.moduleId);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              if (sectionDropHint === section?.moduleId) {
                                setSectionDropHint(null);
                              }
                            }
                          }}
                          onDrop={() =>
                            section && handleSectionDrop(section.moduleId)
                          }
                        >
                          {section ? (
                            <div className={styles.dragCluster}>
                              <DragHandle
                                label={`Reordenar ${section.title}`}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    section.moduleId,
                                  );
                                  setSectionDragKey(section.moduleId);
                                }}
                                onDragEnd={clearSectionDrag}
                                onKeyDown={(e) => {
                                  if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    moveSectionByKeyboard(section, -1);
                                  }
                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    moveSectionByKeyboard(section, 1);
                                  }
                                }}
                              />
                              <ReorderButtons
                                label={section.title}
                                upDisabled={gIdx === 0}
                                downDisabled={gIdx === lessonGroups.length - 1}
                                onUp={() => moveSectionByKeyboard(section, -1)}
                                onDown={() => moveSectionByKeyboard(section, 1)}
                              />
                            </div>
                          ) : (
                            <span className={styles.modulePanelSpacer} />
                          )}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverSrc}
                            alt=""
                            className={styles.modulePanelCover}
                          />
                          <div className={styles.modulePanelMeta}>
                            <h3 className={styles.modulePanelTitle}>
                              {group.moduleTitle}
                            </h3>
                            <p className={styles.feedbackMeta}>
                              {group.lessons.length} aula
                              {group.lessons.length === 1 ? "" : "s"}
                              {section?.comingSoon ? " · Em breve" : null}
                            </p>
                          </div>
                          <div className={styles.modulePanelBadges}>
                            {section?.comingSoon ? (
                              <span
                                className={`${styles.badge} ${styles.badgeOff}`}
                              >
                                Em breve
                              </span>
                            ) : section?.published === false ? (
                              <span
                                className={`${styles.badge} ${styles.badgeOff}`}
                              >
                                Rascunho
                              </span>
                            ) : (
                              <span
                                className={`${styles.badge} ${styles.badgeOn}`}
                              >
                                Publicada
                              </span>
                            )}
                          </div>
                          <div className={styles.modulePanelActions}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              onClick={() => openCreateInModule(group.moduleId)}
                            >
                              + Aula
                            </button>
                            {section ? (
                              <>
                                <button
                                  type="button"
                                  className={styles.editBtn}
                                  onClick={() => openEditSection(section)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className={styles.editBtn}
                                  onClick={() => void deleteSection(section)}
                                >
                                  Excluir
                                </button>
                              </>
                            ) : null}
                          </div>
                        </header>
                        {group.lessons.length === 0 ? (
                          <div
                            className={`${styles.moduleEmpty}${
                              moduleDropHover === group.moduleId && dragKey
                                ? ` ${styles.moduleEmptyDropHover}`
                                : ""
                            }`}
                            onDragOver={(e) => {
                              if (!dragKey) return;
                              e.preventDefault();
                              setModuleDropHover(group.moduleId);
                            }}
                            onDrop={() => handleModuleHeaderDrop(group.moduleId)}
                          >
                            <span>Nenhuma aula nesta seção.</span>
                            <button
                              type="button"
                              className={styles.editBtn}
                              onClick={() => openCreateInModule(group.moduleId)}
                            >
                              Adicionar aula
                            </button>
                          </div>
                        ) : (
                          <div className={styles.tableWrap}>
                            <table
                              className={`${styles.table} ${styles.lessonsAdminTable}`}
                            >
                              <tbody>
                                {group.lessons.map((lesson) => {
                                  const bounds = lessonMoveBounds(
                                    lessons,
                                    lesson,
                                    dbMode,
                                  );
                                  const key = `${lesson.moduleId}:${lesson.lessonId}`;
                                  return (
                                    <LessonRow
                                      key={key}
                                      lesson={lesson}
                                      dbMode={dbMode}
                                      selectMode={selectMode}
                                      selected={selected}
                                      canMoveUp={bounds.canMoveUp}
                                      canMoveDown={bounds.canMoveDown}
                                      dragging={dragKey === key}
                                      dropPosition={
                                        lessonDropHint?.key === key
                                          ? lessonDropHint.position
                                          : null
                                      }
                                      onToggle={toggleSelected}
                                      onCopy={copyText}
                                      onEdit={openEdit}
                                      onPreview={setPreviewLesson}
                                      onFeedback={openFeedback}
                                      onMaterials={openMaterials}
                                      onDelete={deleteLesson}
                                      onDragStart={setDragKey}
                                      onDragEnd={clearLessonDrag}
                                      onDragOverRow={handleLessonDragOver}
                                      onDragLeaveRow={() => setLessonDropHint(null)}
                                      onDrop={handleDrop}
                                      onMoveUp={() => moveByKeyboard(lesson, -1)}
                                      onMoveDown={() => moveByKeyboard(lesson, 1)}
                                      onKeyMove={moveByKeyboard}
                                    />
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ) : (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span>Aulas do curso</span>
                <div className={styles.headActions}>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    aria-pressed={selectMode}
                    onClick={() => {
                      setSelectMode((on) => {
                        if (on) setSelected(new Set());
                        return !on;
                      });
                    }}
                  >
                    {selectMode ? "Sair da seleção" : "Selecionar"}
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={openCreate}
                  >
                    Adicionar aula
                  </button>
                </div>
              </div>
              {selectMode && selected.size > 0 ? (
                <BulkActionBar
                  count={selected.size}
                  onPublish={() => void bulkPublish(true)}
                  onUnpublish={() => void bulkPublish(false)}
                  onClear={() => setSelected(new Set())}
                />
              ) : null}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th />
                      <th>Aula</th>
                      <th>Views</th>
                      <th>Nota</th>
                      <th>Status</th>
                      <th scope="col">Vídeo</th>
                      <th scope="col" aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {lessonGroups.map((group) => (
                      <Fragment key={group.moduleId}>
                        <tr className={styles.moduleRow}>
                          <td>
                            {selectMode ? (
                              <input
                                type="checkbox"
                                aria-label={`Selecionar todas de ${group.moduleTitle}`}
                                checked={group.lessons.every((l) =>
                                  selected.has(`${l.moduleId}:${l.lessonId}`),
                                )}
                                onChange={(e) =>
                                  toggleModuleSelected(
                                    group.lessons.map(
                                      (l) => `${l.moduleId}:${l.lessonId}`,
                                    ),
                                    e.target.checked,
                                  )
                                }
                              />
                            ) : null}
                          </td>
                          <td colSpan={6}>{group.moduleTitle}</td>
                        </tr>
                        {group.lessons.map((lesson) => {
                          const bounds = lessonMoveBounds(
                            lessons,
                            lesson,
                            dbMode,
                          );
                          const key = `${lesson.moduleId}:${lesson.lessonId}`;
                          return (
                            <LessonRow
                              key={key}
                              lesson={lesson}
                              dbMode={false}
                              selectMode={selectMode}
                              selected={selected}
                              canMoveUp={bounds.canMoveUp}
                              canMoveDown={bounds.canMoveDown}
                              dragging={dragKey === key}
                              dropPosition={
                                lessonDropHint?.key === key
                                  ? lessonDropHint.position
                                  : null
                              }
                              onToggle={toggleSelected}
                              onCopy={copyText}
                              onEdit={openEdit}
                              onPreview={setPreviewLesson}
                              onFeedback={openFeedback}
                              onMaterials={openMaterials}
                              onDelete={deleteLesson}
                              onDragStart={setDragKey}
                              onDragEnd={clearLessonDrag}
                              onDragOverRow={handleLessonDragOver}
                              onDragLeaveRow={() => setLessonDropHint(null)}
                              onDrop={handleDrop}
                              onMoveUp={() => moveByKeyboard(lesson, -1)}
                              onMoveDown={() => moveByKeyboard(lesson, 1)}
                              onKeyMove={moveByKeyboard}
                            />
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <details className={styles.feedbackDetails}>
            <summary className={styles.feedbackSummary}>
              Feedbacks recentes
              {feedback.length > 0 ? ` (${feedback.length})` : ""}
            </summary>
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
                          {formatAdminDate(item.created_at)}
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
          </details>
        </>
        )}
      </AdminTabPanel>

      <AdminTabPanel tabId="membros" activeTab={tab}>
        {loading ? (
          <SectionLoading label="Carregando membros…" />
        ) : (
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
                            Cadastro · {formatAdminDate(member.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.progressCell}>
                            <span className={styles.progressValue}>
                              {member.progressPercent}%
                            </span>
                            <ProgressBar
                              value={member.progressPercent}
                              label={`Progresso de ${member.email}`}
                            />
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
                        <td>{formatAdminDate(member.lastActiveAt)}</td>
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
        )}
      </AdminTabPanel>

      <AdminTabPanel tabId="convites" activeTab={tab}>
        {loading ? (
          <SectionLoading label="Carregando convites…" />
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
                            {formatAdminDate(invite.createdAt)}
                          </span>
                        </td>
                        <td>
                          {invite.usedCount}/{invite.maxUses}
                        </td>
                        <td>{formatAdminDate(invite.expiresAt)}</td>
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
      </AdminTabPanel>

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
            <ModalFormUndoKeys
              active
              onUndo={lessonForm.desfazer}
            />
            <h2 id="edit-lesson-title" className={styles.modalTitle}>
              Editar aula
            </h2>
            <p className={styles.modalMeta}>
              {editing.moduleTitle} · {editing.lessonId} · Ctrl+V cola · Ctrl+Z
              desfaz
            </p>

            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={lessonForm.value.title}
                onChange={(e) =>
                  lessonForm.setValue((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Duração</span>
              <input
                className={styles.input}
                value={lessonForm.value.duration}
                onChange={(e) =>
                  lessonForm.setValue((f) => ({ ...f, duration: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tella (slug) — tem prioridade</span>
              <input
                className={styles.input}
                value={lessonForm.value.tella}
                placeholder="01-ca-1-o-que-e-o-claude-f528"
                onChange={(e) =>
                  lessonForm.setValue((f) => ({ ...f, tella: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>YouTube ID</span>
              <input
                className={styles.input}
                value={lessonForm.value.youtubeId}
                placeholder="dQw4w9WgXcQ"
                onChange={(e) =>
                  lessonForm.setValue((f) => ({ ...f, youtubeId: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Descrição</span>
              <textarea
                className={styles.textarea}
                value={lessonForm.value.description}
                onChange={(e) =>
                  lessonForm.setValue((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={lessonForm.value.published}
                onChange={(e) =>
                  lessonForm.setValue((f) => ({ ...f, published: e.target.checked }))
                }
              />
              Publicada (visível no catálogo)
            </label>

            <FormUndoBar
              onDesfazer={lessonForm.desfazer}
              canUndo={lessonForm.canStepUndo}
              isDirty={lessonForm.isDirty}
            >
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
            </FormUndoBar>
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

      {materialsLesson ? (
        <MaterialsModal
          lesson={materialsLesson}
          materials={materials}
          loading={materialsLoading}
          uploading={materialUploading}
          deletingId={materialDeletingId}
          onUpload={uploadMaterial}
          onDelete={deleteMaterial}
          onClose={() => setMaterialsLesson(null)}
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
            <ModalFormUndoKeys active onUndo={createFormCtrl.desfazer} />
            <h2 id="create-lesson-title" className={styles.modalTitle}>
              Adicionar aula
            </h2>
            <p className={styles.modalMeta}>Ctrl+V cola · Ctrl+Z desfaz</p>

            <label className={styles.field}>
              <span className={styles.label}>Módulo</span>
              <select
                className={`${styles.input} ${styles.select}`}
                value={createFormCtrl.value.moduleId}
                disabled={moduleOptions.length === 0}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({
                    ...f,
                    moduleId: e.target.value,
                  }))
                }
              >
                {moduleOptions.length === 0 ? (
                  <option value="">Nenhum módulo — crie uma seção primeiro</option>
                ) : (
                  moduleOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={createFormCtrl.value.title}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Duração</span>
              <input
                className={styles.input}
                value={createFormCtrl.value.duration}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({
                    ...f,
                    duration: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tella (slug) — tem prioridade</span>
              <input
                className={styles.input}
                value={createFormCtrl.value.tella}
                placeholder="01-ca-1-o-que-e-o-claude-f528"
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({ ...f, tella: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>YouTube ID</span>
              <input
                className={styles.input}
                value={createFormCtrl.value.youtubeId}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({
                    ...f,
                    youtubeId: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Descrição</span>
              <textarea
                className={styles.textarea}
                value={createFormCtrl.value.description}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={createFormCtrl.value.published}
                onChange={(e) =>
                  createFormCtrl.setValue((f) => ({
                    ...f,
                    published: e.target.checked,
                  }))
                }
              />
              Publicar já (senão fica como rascunho)
            </label>

            <FormUndoBar
              onDesfazer={createFormCtrl.desfazer}
              canUndo={createFormCtrl.canStepUndo}
              isDirty={createFormCtrl.isDirty}
            >
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
            </FormUndoBar>
          </div>
        </div>
      ) : null}

      {creatingSection ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setCreatingSection(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="create-section-title"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalFormUndoKeys active onUndo={sectionFormCtrl.desfazer} />
            <h2 id="create-section-title" className={styles.modalTitle}>
              {editingSectionId ? "Editar seção" : "Criar seção"}
            </h2>
            <p className={styles.modalMeta}>Ctrl+V cola · Ctrl+Z desfaz</p>

            <label className={styles.field}>
              <span className={styles.label}>Título</span>
              <input
                className={styles.input}
                value={sectionFormCtrl.value.title}
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Descrição</span>
              <textarea
                className={styles.textarea}
                value={sectionFormCtrl.value.description}
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Gradiente (CSS) — capa fallback</span>
              <input
                className={styles.input}
                value={sectionFormCtrl.value.thumbnailGradient}
                placeholder="linear-gradient(135deg, #…, #…)"
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({
                    ...f,
                    thumbnailGradient: e.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Capa do módulo</span>
              <CoverImagePicker
                value={sectionFormCtrl.value.coverImage}
                seasonIndex={
                  editingSectionId
                    ? sections.findIndex((s) => s.moduleId === editingSectionId)
                    : sections.length
                }
                onChange={(coverImage) =>
                  sectionFormCtrl.setValue((f) => ({ ...f, coverImage }))
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Liberar após (dias da matrícula)
              </span>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={sectionFormCtrl.value.unlockAfterDays}
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({
                    ...f,
                    unlockAfterDays: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={sectionFormCtrl.value.published}
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({
                    ...f,
                    published: e.target.checked,
                  }))
                }
              />
              Publicar já (senão fica como rascunho)
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={sectionFormCtrl.value.comingSoon}
                onChange={(e) =>
                  sectionFormCtrl.setValue((f) => ({
                    ...f,
                    comingSoon: e.target.checked,
                  }))
                }
              />
              Em breve (mostra travado em &quot;Sessões em breve&quot; para o
              aluno)
            </label>

            <FormUndoBar
              onDesfazer={sectionFormCtrl.desfazer}
              canUndo={sectionFormCtrl.canStepUndo}
              isDirty={sectionFormCtrl.isDirty}
            >
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setCreatingSection(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={savingSection}
                aria-busy={savingSection}
                onClick={() =>
                  void (editingSectionId ? saveEditSection() : saveNewSection())
                }
              >
                {savingSection ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Salvando…
                  </>
                ) : editingSectionId ? (
                  "Salvar seção"
                ) : (
                  "Criar seção"
                )}
              </button>
            </FormUndoBar>
          </div>
        </div>
      ) : null}
    </div>
  );
}
