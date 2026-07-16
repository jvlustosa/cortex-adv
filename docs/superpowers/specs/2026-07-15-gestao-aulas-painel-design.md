# Gestão de aulas no painel admin — design

**Data:** 2026-07-15
**Área:** Claude Academy · painel `/admin` → aba "Aulas do curso"
**Arquivo-alvo principal:** `src/components/admin/admin-dashboard.tsx`

## Contexto / estado atual

A tabela "Aulas do curso" é renderizada por um único client component (`admin-dashboard.tsx`), alimentado por `GET /api/admin/lessons`. Os dados são o merge de:

1. **Catálogo estático** — `src/data/course.yml` → gerado em `src/data/course-content.ts` (`COURSE`) no build. Fonte da estrutura, dos slugs e da **ordem** (ordem = ordem do array).
2. **Overrides no Supabase** — tabela `lesson_overrides` (PK `module_id, lesson_id`) sobrepõe campos editáveis por aula. Overlay usa null-coalescing (`override?.title ?? lesson.title`).
3. **Analytics** — `lesson_views` (contagem) e `lesson_feedback` (`rating` 1-5 + `comment`).

Hoje existe **só edição** (`PATCH`). Não há adicionar, reordenar, multiselect, preview embedado (o "Preview (Tella)" é `<a target="_blank">`), nem visão dos comentários (a coluna "Nota" mostra só a média agregada em estrelas).

## Decisões (definidas com o usuário)

| Tema | Decisão |
|------|---------|
| Persistência de ordem + aulas novas | **Supabase** (runtime, sem redeploy) |
| Ação em lote (multiselect) | **Publicar / despublicar** apenas |
| Preview do Tella | **Modal** com iframe embedado |
| Reordenar | **Arrastar com alça** (HTML5 nativo, sem dependência), com fallback de teclado leve |
| Ver avaliações | Média + **comentários** por aula, aberto por **ícone revelado no hover** da linha |

## Escopo

Cinco capacidades + uma companheira de segurança:

1. **Adicionar aula** (aula "criada no painel", só-Supabase).
2. **Reordenar** aulas dentro do módulo (drag handle).
3. **Multiselect → publicar/despublicar** em lote.
4. **Preview inline** do Tella (modal).
5. **Ver avaliações** da aula: média, total e lista de comentários.
6. **Excluir** aula — só as criadas no painel (companheira de segurança do "adicionar").

**Fora de escopo:** criar/reordenar/renomear módulos, mover aula entre módulos, excluir em lote, escrever de volta no `course.yml`.

## Modelo de dados

Migration nova **`supabase/migrations/013_lesson_order.sql`** — uma coluna só:

```sql
alter table public.lesson_overrides
  add column if not exists order_index integer;

create index if not exists lesson_overrides_module_order_idx
  on public.lesson_overrides (module_id, order_index);
```

Não crio tabela nem coluna a mais.

- **Aula de catálogo:** existe em `COURSE`. Pode ter (ou não) linha em `lesson_overrides`.
- **Aula criada no painel (só-Supabase):** linha em `lesson_overrides` cujo `(module_id, lesson_id)` **não** está em `COURSE`. Origem derivada por presença no catálogo — **sem coluna `origin`**. Como o overlay é null-coalescing e essa aula não tem catálogo de fallback, a linha precisa trazer `title`/`tella`/`duration`/`description` preenchidos na criação.
- **Módulos** continuam vindo do YAML. Aula nova é sempre anexada a um módulo existente.

> ⚠️ **Deploy:** a migration `013` precisa ser rodada **à mão no SQL editor do Supabase** — este projeto não tem runner automático (mesmo caso das migrations 011/012). Sem ela: leitura degrada limpo (`order_index` `undefined` → cai no `catalogIndex`), mas **adicionar/reordenar/batch dão 500** (`column order_index does not exist`) — a UI deve mostrar erro amigável, não é degradação silenciosa.

## Ordenação

Ordem efetiva de uma aula dentro do módulo:

```
effectiveOrder = order_index ?? catalogIndex
```

- `catalogIndex` = posição da aula no array `COURSE.modules[].lessons[]`.
- Aula só-Supabase sempre tem `order_index` (setado na criação), então sempre tem valor.
- **Enquanto ninguém reordena um módulo, a ordem é idêntica à de hoje** (retrocompatível).
- No **primeiro reorder** de um módulo, grava `order_index` explícito (0..n) em **todas** as aulas daquele módulo, pra eliminar ambiguidade.
- Desempate estável: `effectiveOrder`, depois `catalogIndex` (aula custom não tem `catalogIndex` → ordena **depois** dos empates de catálogo), depois `title`.

Ao criar aula nova: `order_index = max(effectiveOrder do módulo) + 1` — `max` sobre `effectiveOrder = order_index ?? catalogIndex` de **todas** as aulas do módulo (não o `max` da coluna crua, que é `null` num módulo nunca reordenado). Vai pro fim.

## API — `/api/admin/lessons`

Todas as rotas atrás de `assertAdminApi()`.

### `POST /api/admin/lessons` — criar aula
Body: `{ moduleId, title, tella?, youtubeId?, duration?, description?, published }`.
- Valida `moduleId` contra os módulos do catálogo.
- Gera `lesson_id` via `slugify(title)` (lowercase, sem acento, não-alfanumérico → hífen). Título vazio/só-símbolos → slug degenera pra `""` → **fallback `aula`**. Não existe helper `slugify` no repo — criar um.
- Unicidade **dentro do módulo** contra catálogo **e** overrides (scan de `fetchLessonOverrides()` filtrado por módulo); colisão → sufixo `-2`, `-3`…
- **`.insert()` (não `.upsert()`)** — assim uma corrida de dois creates com o mesmo título estoura no PK `(module_id, lesson_id)` em vez de sobrescrever silenciosamente.
- Campos preenchidos + `order_index = max(effectiveOrder)+1`.
- Retorna o `LessonAdminRow` novo.

### `PATCH /api/admin/lessons` — editar (já existe)
Mantém. Estendido para aceitar `order_index` opcional (não obrigatório aqui — reorder tem rota própria).

### `POST /api/admin/lessons/reorder` — reordenar módulo
Body: `{ moduleId, lessonIds: string[] }` (ordem final das aulas do módulo).
- Upsert com **payload uniforme** `{ module_id, lesson_id, order_index }` (`onConflict: "module_id,lesson_id"`). ⚠️ O supabase-js aplica o **mesmo conjunto de colunas** como `ON CONFLICT DO UPDATE SET` para todas as linhas do batch — então o payload **só pode conter `order_index`** (nada de `published`).
- **Linha existente:** `DO UPDATE SET order_index` — published/title/tella **intactos**.
- **Linha nova** (aula de catálogo sem override): `published` cai no `default true` da coluna (= default do catálogo); title/tella/etc. ficam null → overlay cai no catálogo. Sem efeito colateral.
- ❌ **Nunca** pôr `published` no payload de reorder: reescreveria `published = true` em rascunhos que o admin despublicou (regressão do Risco #1).

### `POST /api/admin/lessons/batch` — publicar/despublicar em lote
Body: `{ keys: Array<{ moduleId, lessonId }>, published: boolean }`.
- Upsert com payload uniforme `{ module_id, lesson_id, published }` (`onConflict` toca **só** `published`). Linha nova de catálogo: title/tella/order_index ficam null → overlay/ordem caem no catálogo, sem apagar nada.

### `DELETE /api/admin/lessons` — excluir aula só-Supabase
Body: `{ moduleId, lessonId }`.
- **Guard server-side:** se `(moduleId, lessonId)` existe no catálogo → `400` ("aula de catálogo não pode ser removida pelo painel"). Só remove aula criada no painel.
- **Cascata:** apaga também `lesson_views` e `lesson_feedback` da chave — senão `getCompletedLessonKeys` retorna a chave órfã e o progresso/contagem do membro fica inflado ("X/total" acima do total).

### `GET /api/admin/lessons/feedback?moduleId=&lessonId=` — avaliações da aula
- Retorna `{ avg, count, items: Array<{ rating, comment, userEmail, createdAt }> }`, ordenado por `created_at desc`, com **`limit` (ex.: 200)**.
- Resolução de e-mail no padrão de `listRecentFeedback()` (`auth.admin.getUserById` por usuário **distinto** — N por usuários únicos, não por linha; ok pro volume atual).

## Repositório — `src/lib/lessons/repository.ts` + tipos

- `LessonOverrideRow` (`types.ts`) ganha `order_index: number | null` (a coluna nova). `LessonAdminRow` ganha `orderIndex: number | null` e `origin: "catalog" | "custom"`.
- `upsertLessonOverride()` passa a aceitar `orderIndex?` (o `PATCH` estendido usa esse caminho).
- `listLessonsForAdmin()`: além de iterar `COURSE`, incluir linhas de `lesson_overrides` **sem** correspondente no catálogo (só-Supabase) no módulo delas; ordenar cada módulo por `effectiveOrder`. Emitir `origin` e `orderIndex`.
- Novas funções: `createLesson()` (`.insert`), `reorderModule()`, `setPublishedBatch()`, `deleteCustomLesson()` (+ cascata analytics), `listFeedbackForLesson()`.

## Lado dos membros (o risco real)

### `src/lib/lessons/merge-course.ts` — `getMergedCourse()`
1. **Incluir** aulas só-Supabase no módulo correspondente. Como a linha de override é a única fonte da aula custom, montar o `CourseLesson` sintético mapeando campos (`youtube_id`→`youtubeId`, `tella`, `title`, `duration`, `description`) com **null-guards** (defaults seguros; as colunas são nullable mesmo que `createLesson` preencha).
2. Respeitar o branch `includeUnpublished`: custom não-publicada só aparece quando `includeUnpublished` (ex.: preview admin), igual às de catálogo.
3. **Ordenar** cada módulo por `effectiveOrder`. Tie-break: catálogo antes de custom nos empates, depois `title`.
4. Custom com `module_id` fora do catálogo → ignorada (a UI restringe a módulos existentes).
5. **Módulo que ficou sem aulas publicadas → dropar do resultado** (ver crash abaixo).
6. Supabase não configurado → degrada pro catálogo puro (custom somem, ordem volta ao YAML) — degradação já existente.

### Módulo vazio quebra o player — `course-area.tsx:46-96`
`pickInitial` e `activeLesson.tella` dão deref em `undefined` quando um módulo tem 0 aulas publicadas. Com o multiselect isso vira **um clique** (despublicar todas de um módulo). Blindar: `getMergedCourse` dropa módulos vazios **e** `course-area` trata "sem aulas" sem estourar.

### Denominador de progresso / certificado — `src/lib/course/progress.ts:15-27`, `src/lib/admin/members.ts:33-34`
`countPublishedLessons` e `countCourseLessons` contam **só o catálogo**. Se aula custom conta como concluída (`lesson_views`) mas fica fora do total → `concluídas > total` → certificado emitido cedo, "7 de 5 aulas", progresso >100%. **Atualizar os dois contadores** pra incluir custom publicadas, com o mesmo merge. Sem isso, adicionar aula quebra o progresso.

## UI — `admin-dashboard.tsx` + `.module.css`

- **Agrupar a tabela por módulo** (subcabeçalho por módulo); reorder só faz sentido dentro do módulo.
- **"Adicionar aula"**: botão perto do cabeçalho → modal (mesma cara do modal de editar) com `<select>` de módulo + campos + toggle publicado. `POST`.
- **Reordenar**: alça de arrastar (`<button aria-label="Reordenar aula">`, `draggable`) por linha; drag nativo dentro do módulo; on drop calcula nova ordem, atualiza otimista e chama `/reorder`. **Se `/reorder` falhar, reverte a ordem local** (guarda snapshot anterior). Fallback de teclado leve (foco na alça + `ArrowUp`/`ArrowDown` move a aula).
- **Multiselect**: coluna de checkbox + "selecionar todos" (por módulo); barra de ação que surge com seleção → **Publicar / Despublicar**. `POST /batch`.
- **Preview (modal)**: troca o link externo por abrir modal com iframe `https://www.tella.tv/video/${tella}/embed?b=0&title=0&a=0` (mesmo padrão de `course-area.tsx:219`); fallback YouTube `youtube-nocookie.com/embed/...`; sem vídeo → placeholder. Mantém "Copiar link" e um "abrir no Tella" externo.
- **Ver avaliações**: ícone (ex.: balão/estrela) **revelado no hover da linha** (`<button aria-label="Ver avaliações">`); clique abre modal com **média + total + lista de comentários** (rating, e-mail, data). Vazio → "Sem avaliações ainda". `GET /feedback`.
- **Aula criada no painel**: badge discreto + botão excluir (lixeira, `aria-label`) só nelas → `DELETE` com confirmação.

## Acessibilidade

- Toda alça/ícone é `<button>` com `aria-label` (regra do projeto: nunca `<div onClick>`, sempre label em botão de ícone).
- Modais: foco preso, `Esc` fecha, retorno de foco ao gatilho.
- Drag tem fallback de teclado (setas) pra não deixar reorder inacessível.
- Checkboxes rotulados.

## Riscos & mitigação

1. **Apagar campos de aula visível ao membro** via reorder/batch gravando null → upsert toca só a coluna-alvo (`onConflict DO UPDATE SET` mínimo); overlay é null-coalescing; `published default true`. **Verificar em teste** que reorder/batch não mexem em title/tella/published de aula editada.
2. **Regressão de ordem/inclusão no lado dos membros** → testes de `getMergedCourse` + checagem manual de um módulo antes/depois no `course-area`.
3. **Migration não aplicada** → degradação silenciosa (ordem = catálogo, custom invisível). Documentado; feature checa `order_index` disponível.
4. **Colisão de slug** ao criar → unicidade dentro do módulo contra catálogo + overrides.
5. **PII/LGPD** no modal de avaliações (e-mail + comentário) → só admin (`requireAdmin`), padrão já usado em `listRecentFeedback`; nunca logar e-mail/comentário.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/013_lesson_order.sql` | **novo** — `order_index` + índice |
| `src/lib/lessons/types.ts` | `LessonAdminRow` ganha `orderIndex`, `origin`; tipo de feedback por aula |
| `src/lib/lessons/repository.ts` | list ordenada + custom; `createLesson`/`reorderModule`/`setPublishedBatch`/`deleteCustomLesson`/`listFeedbackForLesson` |
| `src/lib/lessons/merge-course.ts` | incluir custom publicadas + ordenar |
| `src/app/api/admin/lessons/route.ts` | `POST`, `DELETE`, estende `PATCH` |
| `src/app/api/admin/lessons/reorder/route.ts` | **novo** |
| `src/app/api/admin/lessons/batch/route.ts` | **novo** |
| `src/app/api/admin/lessons/feedback/route.ts` | **novo** |
| `src/components/admin/admin-dashboard.tsx` | agrupar, drag, multiselect, modal add/preview/feedback, delete |
| `src/components/admin/admin-dashboard.module.css` | estilos |

## Verificação

- **Unit:** função de ordem efetiva; gerador de slug (unicidade/colisão).
- **Integração (rotas):** `POST` cria; `/reorder` reescreve ordem sem tocar published/title; `/batch` alterna publicado; `DELETE` barra aula de catálogo; `/feedback` retorna média+comentários.
- **Manual (skill `verify`/`run`):** subir app → `/admin` → reordenar um módulo, adicionar aula, publicar/despublicar em lote, abrir preview, abrir avaliações. Depois conferir no `course-area` (lado membro) que a ordem e o filtro de publicadas refletem, e que nenhuma aula editada teve título/tella apagados.
