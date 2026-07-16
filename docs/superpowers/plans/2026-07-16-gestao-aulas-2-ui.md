# Gestão de aulas — Plano B: UI do painel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na aba "Gestão de aulas" do painel: agrupar por módulo, adicionar aula, reordenar por arrastar, multiselect para publicar/despublicar em lote, preview do Tella em modal, ver avaliações (média + comentários) por aula via ícone no hover, e excluir aulas criadas no painel.

**Architecture:** Tudo em `src/components/admin/admin-dashboard.tsx` (client component já existente) + `admin-dashboard.module.css`. Consome as rotas do Plano A. Reaproveita o padrão de modal (`modalBackdrop`/`modal`), campos (`.field`/`.input`) e botões (`.editBtn`/`.btnPrimary`) já usados no arquivo. Drag = HTML5 nativo (sem dependência), com fallback de teclado.

**Tech Stack:** Next.js 16.2 client component, React 19, TypeScript strict, CSS Modules. Ícones: **lucide-react apenas** (regra do projeto). Testes: Playwright e2e + verificação manual (skill `verify`).

**Depende de:** Plano A concluído (rotas `POST`/`DELETE`/`/reorder`/`/batch`/`/feedback`, `LessonAdminRow.origin/orderIndex`).

**Spec:** `docs/superpowers/specs/2026-07-15-gestao-aulas-painel-design.md`

> ⚠️ Regras de UI do projeto: `<button>` para cliques (nunca `<div onClick>`), `aria-label` em botão só-ícone, cores só do design system, `cn()`/`clsx` para classes condicionais. Copy em pt-BR, tom direto (AGENTS.md).

---

## Task 1: Agrupar a tabela por módulo

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`

- [ ] **Step 1: Helper de agrupamento** (após `lessonVideo`, antes de `VideoCell`)

```ts
type LessonGroup = { moduleId: string; moduleTitle: string; lessons: LessonAdminRow[] };

/** Agrupa aulas por módulo preservando a ordem que o backend já entregou. */
function groupByModule(lessons: LessonAdminRow[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  for (const lesson of lessons) {
    let g = groups.find((x) => x.moduleId === lesson.moduleId);
    if (!g) {
      g = { moduleId: lesson.moduleId, moduleTitle: lesson.moduleTitle, lessons: [] };
      groups.push(g);
    }
    g.lessons.push(lesson);
  }
  return groups;
}
```

- [ ] **Step 2: Refatorar o `<tbody>`** (linhas ~429-473) para iterar grupos

Substitua o `{lessons.map(...)}` por um render que, para cada grupo, emite uma linha de subcabeçalho + as aulas. Extraia a linha da aula para um componente interno `LessonRow` (facilita as próximas tasks):

```tsx
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
        />
      ))}
    </Fragment>
  ))}
</tbody>
```

Adicione `Fragment` ao import do react: `import { Fragment, useCallback, useEffect, useState } from "react";`

- [ ] **Step 3: Componente `LessonRow`** (mova o conteúdo da `<tr>` atual pra cá; mantém colunas idênticas por enquanto)

```tsx
function LessonRow({
  lesson,
  onCopy,
  onEdit,
}: {
  lesson: LessonAdminRow;
  onCopy: (text: string) => void;
  onEdit: (l: LessonAdminRow) => void;
}) {
  return (
    <tr>
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
        <VideoCell lesson={lesson} onCopy={onCopy} />
      </td>
      <td>
        <button type="button" className={styles.editBtn} onClick={() => onEdit(lesson)}>
          Editar
        </button>
      </td>
    </tr>
  );
}
```

- [ ] **Step 4: Estilo do subcabeçalho** em `admin-dashboard.module.css`

```css
.moduleRow td {
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--muted, #9ca3af);
  padding-top: 1rem;
}
```

- [ ] **Step 5: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): group lessons table by module"
```

---

## Task 2: Preview do Tella em modal

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Helper de URL de embed** (junto de `lessonVideo`)

```ts
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
```

- [ ] **Step 2: Estado do preview** (junto dos outros `useState` do dashboard)

```ts
const [previewLesson, setPreviewLesson] = useState<LessonAdminRow | null>(null);
```

- [ ] **Step 3: `VideoCell` abre o modal** em vez de link externo

Troque o `<a ... target="_blank">Preview</a>` por um botão, e adicione uma prop `onPreview`:

```tsx
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
      <button type="button" className={styles.editBtn} onClick={() => onPreview(lesson)}>
        Preview ({video.label})
      </button>
      <button type="button" className={styles.editBtn} onClick={() => onCopy(video.url)}>
        Copiar link
      </button>
      <a className={styles.editBtn} href={video.url} target="_blank" rel="noopener noreferrer">
        Abrir
      </a>
    </div>
  );
}
```

Passe `onPreview={setPreviewLesson}` no `LessonRow` e repasse ao `VideoCell`.

- [ ] **Step 4: Componente `PreviewModal`** (renderize no fim do JSX, junto do modal de edição)

```tsx
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
          <button type="button" className={styles.editBtn} onClick={onClose} aria-label="Fechar preview">
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
```

Renderize: `{previewLesson ? <PreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} /> : null}`

- [ ] **Step 5: CSS do player 16:9 + modal largo**

```css
.modalWide {
  background: var(--surface, #14110f);
  border-radius: 16px;
  padding: 1.25rem;
  width: min(880px, 92vw);
  max-height: 90vh;
  overflow: auto;
}
.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.playerWrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}
.player {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
```

- [ ] **Step 6: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): inline Tella preview modal"
```

---

## Task 3: Avaliações por aula (ícone no hover → modal)

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Tipo + estado**

```ts
import { MessageSquare } from "lucide-react"; // adicionar ao import de lucide-react

type LessonFeedbackDetail = {
  avg: number | null;
  count: number;
  items: { rating: number; comment: string | null; userEmail: string | null; createdAt: string }[];
};

// dentro do componente:
const [feedbackLesson, setFeedbackLesson] = useState<LessonAdminRow | null>(null);
const [feedbackDetail, setFeedbackDetail] = useState<LessonFeedbackDetail | null>(null);
const [feedbackLoading, setFeedbackLoading] = useState(false);

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
```

- [ ] **Step 2: Ícone revelado no hover na célula "Nota"** do `LessonRow`

Envolva a `<tr>` com a classe `styles.lessonRow` e adicione, na célula da Nota, o botão de ícone:

```tsx
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
```

Adicione a prop `onFeedback` ao `LessonRow` e passe `onFeedback={openFeedback}`.

- [ ] **Step 3: Componente `FeedbackModal`**

```tsx
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
          <button type="button" className={styles.editBtn} onClick={onClose} aria-label="Fechar">
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
```

Renderize junto dos outros modais:

```tsx
{feedbackLesson ? (
  <FeedbackModal
    lesson={feedbackLesson}
    detail={feedbackDetail}
    loading={feedbackLoading}
    onClose={() => setFeedbackLesson(null)}
  />
) : null}
```

- [ ] **Step 4: CSS — ícone só no hover da linha**

```css
.notaCell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.hoverIcon {
  opacity: 0;
  transition: opacity 0.12s ease;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--muted, #9ca3af);
  padding: 0.15rem;
}
.lessonRow:hover .hoverIcon,
.hoverIcon:focus-visible {
  opacity: 1;
}
```

Adicione `className={styles.lessonRow}` à `<tr>` do `LessonRow`.

- [ ] **Step 5: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): per-lesson feedback modal via hover icon"
```

---

## Task 4: Adicionar aula (modal com seletor de módulo)

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Lista de módulos** (para o `<select>`) — derive das aulas carregadas

```ts
// dentro do componente, após carregar lessons:
const moduleOptions = groupByModule(lessons).map((g) => ({ id: g.moduleId, title: g.moduleTitle }));
```

- [ ] **Step 2: Estado do create**

```ts
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
    if (!res.ok) throw new Error(await readApiErrorMessage(res, "Erro ao criar aula."));
    setCreating(false);
    await loadLessons();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Erro ao criar aula.");
  } finally {
    setSaving(false);
  }
}
```

- [ ] **Step 3: Botão "Adicionar aula"** no `sectionHead` (linha ~416)

```tsx
<div className={styles.sectionHead}>
  <span>Aulas do curso</span>
  <button type="button" className={styles.btnPrimary} onClick={openCreate}>
    Adicionar aula
  </button>
</div>
```

Ajuste `.sectionHead` no CSS para `display:flex; justify-content:space-between; align-items:center;` (se ainda não for).

- [ ] **Step 4: Modal de create** (renderize junto dos demais; reaproveita classes do modal de editar)

```tsx
{creating ? (
  <div className={styles.modalBackdrop} role="presentation" onClick={() => setCreating(false)}>
    <div
      className={styles.modal}
      role="dialog"
      aria-labelledby="create-lesson-title"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 id="create-lesson-title" className={styles.modalTitle}>Adicionar aula</h2>

      <label className={styles.field}>
        <span className={styles.label}>Módulo</span>
        <select
          className={styles.input}
          value={createForm.moduleId}
          onChange={(e) => setCreateForm((f) => ({ ...f, moduleId: e.target.value }))}
        >
          {moduleOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Título</span>
        <input
          className={styles.input}
          value={createForm.title}
          onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Duração</span>
        <input
          className={styles.input}
          value={createForm.duration}
          onChange={(e) => setCreateForm((f) => ({ ...f, duration: e.target.value }))}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Tella (slug) — tem prioridade</span>
        <input
          className={styles.input}
          value={createForm.tella}
          placeholder="01-ca-1-o-que-e-o-claude-f528"
          onChange={(e) => setCreateForm((f) => ({ ...f, tella: e.target.value }))}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>YouTube ID</span>
        <input
          className={styles.input}
          value={createForm.youtubeId}
          onChange={(e) => setCreateForm((f) => ({ ...f, youtubeId: e.target.value }))}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea
          className={styles.textarea}
          value={createForm.description}
          onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
        />
      </label>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={createForm.published}
          onChange={(e) => setCreateForm((f) => ({ ...f, published: e.target.checked }))}
        />
        Publicar já (senão fica como rascunho)
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.btnGhost} onClick={() => setCreating(false)}>
          Cancelar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={saving}
          aria-busy={saving}
          onClick={() => void saveNewLesson()}
        >
          {saving ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Criando…</>) : "Criar aula"}
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 5: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): add-lesson modal (module select) wired to POST"
```

---

## Task 5: Excluir aula criada no painel

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Handler de delete**

```ts
async function deleteLesson(lesson: LessonAdminRow) {
  if (!window.confirm(`Excluir "${lesson.title}"? Isso remove a aula e suas avaliações. Ação irreversível.`)) {
    return;
  }
  setError(null);
  try {
    const res = await fetch("/api/admin/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: lesson.moduleId, lessonId: lesson.lessonId }),
    });
    if (!res.ok) throw new Error(await readApiErrorMessage(res, "Erro ao excluir."));
    await loadLessons();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Erro ao excluir.");
  }
}
```

- [ ] **Step 2: Badge "criada no painel" + botão excluir** só em `origin === "custom"`

No `LessonRow`, na célula "Aula", após o `<span>` do módulo/slug:

```tsx
{lesson.origin === "custom" ? (
  <span className={styles.customBadge}>criada no painel</span>
) : null}
```

Na célula de ações (última `<td>`), ao lado do "Editar":

```tsx
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
```

Adicione `Trash2` ao import de lucide-react, a prop `onDelete` ao `LessonRow`, e passe `onDelete={deleteLesson}`.

> ⚠️ **Não** use `styles.dangerBtn` — já existe no CSS (é o pill do botão "Banir" de membros). Use uma classe nova `.iconDangerBtn` pro ícone de excluir.

- [ ] **Step 3: CSS** (classe nova, sem colidir com `.dangerBtn` existente)

```css
.customBadge {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.68rem;
  padding: 0.05rem 0.4rem;
  border-radius: 6px;
  background: rgba(217, 119, 87, 0.15);
  color: var(--claude, #d97757);
}
.iconDangerBtn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--danger, #ef4444);
  padding: 0.25rem;
}
```

- [ ] **Step 4: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): delete custom lesson with confirm + badge"
```

---

## Task 6: Multiselect + publicar/despublicar em lote

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Estado da seleção** (chaves `module:lesson`)

```ts
const [selected, setSelected] = useState<Set<string>>(new Set());

function toggleSelected(key: string) {
  setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
}
function toggleModuleSelected(keys: string[], on: boolean) {
  setSelected((prev) => {
    const next = new Set(prev);
    for (const k of keys) { if (on) next.add(k); else next.delete(k); }
    return next;
  });
}
```

> Limpe a seleção ao recarregar: no fim de `loadLessons`, adicione `setSelected(new Set());`

- [ ] **Step 2: Ação em lote**

```ts
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
    if (!res.ok) throw new Error(await readApiErrorMessage(res, "Erro no lote."));
    await loadLessons();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Erro no lote.");
  }
}
```

> ⚠️ A chave usa `:` como separador; os `moduleId`/`lessonId` do catálogo são slugs sem `:`. `split(":")` é seguro aqui.

- [ ] **Step 3: Coluna de checkbox** — adicione um `<th />` no início do `<thead>` e uma célula no `LessonRow`:

```tsx
<td>
  <input
    type="checkbox"
    checked={selected.has(`${lesson.moduleId}:${lesson.lessonId}`)}
    onChange={() => onToggle(`${lesson.moduleId}:${lesson.lessonId}`)}
    aria-label={`Selecionar ${lesson.title}`}
  />
</td>
```

Passe `selected`/`onToggle` ao `LessonRow`. **Não** mexa no `colSpan={6}` do título da linha de módulo — no Step 4 a linha de módulo ganha um `<td>` de checkbox **antes** do título (1 + 6 = 7 colunas, alinhado).

- [ ] **Step 4: "Selecionar todos" por módulo** na linha de subcabeçalho

```tsx
<tr className={styles.moduleRow}>
  <td>
    <input
      type="checkbox"
      aria-label={`Selecionar todas de ${group.moduleTitle}`}
      checked={group.lessons.every((l) => selected.has(`${l.moduleId}:${l.lessonId}`))}
      onChange={(e) =>
        toggleModuleSelected(
          group.lessons.map((l) => `${l.moduleId}:${l.lessonId}`),
          e.target.checked,
        )
      }
    />
  </td>
  <td colSpan={6}>{group.moduleTitle}</td>
</tr>
```

- [ ] **Step 5: Barra de ação em lote** (acima da tabela, só quando há seleção)

```tsx
{selected.size > 0 ? (
  <div className={styles.bulkBar}>
    <span>{selected.size} selecionada(s)</span>
    <button type="button" className={styles.editBtn} onClick={() => void bulkPublish(true)}>
      Publicar
    </button>
    <button type="button" className={styles.editBtn} onClick={() => void bulkPublish(false)}>
      Despublicar
    </button>
    <button type="button" className={styles.btnGhost} onClick={() => setSelected(new Set())}>
      Limpar
    </button>
  </div>
) : null}
```

- [ ] **Step 6: CSS da barra**

```css
.bulkBar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.75rem;
  border-radius: 10px;
  background: var(--surface-2, rgba(255,255,255,0.04));
}
```

- [ ] **Step 7: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): multiselect + bulk publish/unpublish"
```

---

## Task 7: Reordenar por arrastar (drag handle) + fallback de teclado

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/components/admin/admin-dashboard.module.css`

- [ ] **Step 1: Helper puro de mover dentro do módulo** (fora do componente)

```ts
/** Move uma aula dentro do seu módulo, retornando a lista achatada nova. */
function moveWithinModule(
  lessons: LessonAdminRow[],
  moduleId: string,
  fromKey: string,
  toKey: string,
): LessonAdminRow[] {
  const modKeys = lessons.filter((l) => l.moduleId === moduleId).map((l) => `${l.moduleId}:${l.lessonId}`);
  const from = modKeys.indexOf(fromKey);
  const to = modKeys.indexOf(toKey);
  if (from < 0 || to < 0 || from === to) return lessons;
  modKeys.splice(to, 0, modKeys.splice(from, 1)[0]);
  // reconstrói a lista achatada preservando ordem dos módulos
  const byKey = new Map(lessons.map((l) => [`${l.moduleId}:${l.lessonId}`, l]));
  const result: LessonAdminRow[] = [];
  const seenModule = new Set<string>();
  for (const l of lessons) {
    if (l.moduleId === moduleId) {
      if (!seenModule.has(moduleId)) {
        seenModule.add(moduleId);
        for (const k of modKeys) result.push(byKey.get(k)!);
      }
    } else {
      result.push(l);
    }
  }
  return result;
}
```

- [ ] **Step 2: Estado de drag + persistência**

```ts
const [dragKey, setDragKey] = useState<string | null>(null);

async function persistOrder(moduleId: string, ordered: LessonAdminRow[]) {
  const lessonIds = ordered.filter((l) => l.moduleId === moduleId).map((l) => l.lessonId);
  const snapshot = lessons;
  try {
    const res = await fetch("/api/admin/lessons/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, lessonIds }),
    });
    if (!res.ok) throw new Error("reorder falhou");
  } catch {
    setLessons(snapshot); // rollback otimista
    setError("Não consegui salvar a nova ordem. Revertido.");
  }
}

function handleDrop(moduleId: string, targetKey: string) {
  if (!dragKey) return;
  const dragged = lessons.find((l) => `${l.moduleId}:${l.lessonId}` === dragKey);
  if (!dragged || dragged.moduleId !== moduleId) { setDragKey(null); return; } // só dentro do módulo
  const next = moveWithinModule(lessons, moduleId, dragKey, targetKey);
  setLessons(next);
  setDragKey(null);
  void persistOrder(moduleId, next);
}

function moveByKeyboard(lesson: LessonAdminRow, dir: -1 | 1) {
  const key = `${lesson.moduleId}:${lesson.lessonId}`;
  const modLessons = lessons.filter((l) => l.moduleId === lesson.moduleId);
  const idx = modLessons.findIndex((l) => `${l.moduleId}:${l.lessonId}` === key);
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= modLessons.length) return;
  const targetKey = `${modLessons[targetIdx].moduleId}:${modLessons[targetIdx].lessonId}`;
  const next = moveWithinModule(lessons, lesson.moduleId, key, targetKey);
  setLessons(next);
  void persistOrder(lesson.moduleId, next);
}
```

- [ ] **Step 3: Alça + eventos de drag no `LessonRow`**

Torne a `<tr>` `draggable` e adicione a alça como primeira coisa da célula "Aula":

```tsx
<tr
  className={styles.lessonRow}
  draggable
  onDragStart={() => onDragStart(`${lesson.moduleId}:${lesson.lessonId}`)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => onDrop(lesson.moduleId, `${lesson.moduleId}:${lesson.lessonId}`)}
>
  <td>{/* checkbox da Task 6 */}</td>
  <td>
    <div className={styles.aulaCell}>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`Reordenar ${lesson.title}. Use as setas para cima e para baixo.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); onKeyMove(lesson, -1); }
          if (e.key === "ArrowDown") { e.preventDefault(); onKeyMove(lesson, 1); }
        }}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div>
        <strong>{lesson.title}</strong>
        <br />
        <span className={styles.feedbackMeta}>{lesson.moduleTitle} · {lesson.lessonId}</span>
        {lesson.origin === "custom" ? <span className={styles.customBadge}>criada no painel</span> : null}
      </div>
    </div>
  </td>
  {/* demais células */}
</tr>
```

Adicione `GripVertical` ao import de lucide-react e as props `onDragStart`/`onDrop`/`onKeyMove` ao `LessonRow`, passando `setDragKey`, `handleDrop`, `moveByKeyboard`.

- [ ] **Step 4: CSS**

```css
.aulaCell { display: flex; align-items: flex-start; gap: 0.5rem; }
.dragHandle {
  background: transparent; border: 0; cursor: grab;
  color: var(--muted, #9ca3af); padding: 0.15rem; margin-top: 0.1rem;
}
.dragHandle:active { cursor: grabbing; }
.lessonRow[draggable="true"] { user-select: none; }
```

- [ ] **Step 5: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/components/admin/admin-dashboard.tsx src/components/admin/admin-dashboard.module.css
git commit -m "feat(admin): drag-to-reorder within module + keyboard fallback + optimistic rollback"
```

---

## Task 8: e2e (Playwright) + verificação final

**Files:**
- Create: `tests/e2e/admin-lessons.spec.ts` (siga o padrão dos specs existentes em `tests/e2e/`)

- [ ] **Step 1: Ler um spec e2e existente** para copiar o setup de auth/admin

Run: `ls tests/e2e && sed -n '1,40p' tests/e2e/*.spec.ts | head -80`
Confirme como o teste autentica como admin (fixture/login) antes de escrever o novo.

- [ ] **Step 2: Escrever o e2e do fluxo admin** (adapte ao setup de auth encontrado)

Cobrir, na aba "Gestão de aulas":
- a tabela renderiza agrupada por módulo;
- "Adicionar aula" cria e a aula aparece com badge "criada no painel";
- selecionar 2 aulas e "Despublicar" muda o status para "Rascunho";
- "Preview" abre o modal com `<iframe>`;
- o ícone de avaliações abre o modal (média/"Sem avaliações ainda").

```ts
import { test, expect } from "@playwright/test";
// ...setup de login admin conforme o padrão do repo...

test("admin cria, seleciona e despublica aula", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Adicionar aula" }).click();
  await page.getByLabel("Título", { exact: false }).fill("Aula de teste e2e");
  await page.getByRole("button", { name: /Criar aula/ }).click();
  await expect(page.getByText("Aula de teste e2e")).toBeVisible();
  await expect(page.getByText("criada no painel").last()).toBeVisible();
});
```

- [ ] **Step 3: Rodar e2e**

Run: `npm run test:e2e -- admin-lessons`
Expected: PASS (com app + Supabase de teste disponíveis).

- [ ] **Step 4: Verificação manual completa** (skill `verify`/`run`)

Suba `npm run dev`, logue como admin, e exercite os 6 recursos: agrupamento, adicionar, arrastar pra reordenar (e recarregar pra confirmar persistência), multiselect publicar/despublicar, preview, avaliações, excluir custom. Depois abra `/curso` como membro e confirme ordem + publicadas + nenhum crash.

- [ ] **Step 5: Self-review do diff**

Run: `git diff main...HEAD`
Confira: só arquivos previstos, copy pt-BR, sem `console.log` de PII, `aria-label` em todos os botões de ícone.

- [ ] **Step 6: Commit final**

```bash
git add tests/e2e/admin-lessons.spec.ts
git commit -m "test(e2e): admin lesson-management flows"
```

---

## Definition of done (Plano B)

- Aba "Gestão de aulas" agrupada por módulo, com: adicionar, arrastar-reordenar (+ teclado), multiselect publicar/despublicar, preview em modal, avaliações por aula (ícone no hover), excluir custom.
- `npx tsc --noEmit && npm run lint` verdes; e2e passando; verificação manual ok no admin e no lado membro.
- Todos os botões de ícone com `aria-label`; copy em pt-BR; só ícones lucide.
