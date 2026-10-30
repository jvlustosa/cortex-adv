# Materiais Didáticos — como cadastrar apostilas

Seção da área de membros com as apostilas do curso em PDF, separadas por
categoria, com busca: `/area-de-membros/materiais`.

## Como funciona, em uma frase

O **texto** da apostila (título, descrição, categoria, tópicos, capa) entra por
**PR**, em `src/data/materiais.ts`. O **PDF** entra pelo **/admin**, aba
"Materiais Didáticos", depois do deploy. Ninguém precisa mexer no banco.

| O quê | Onde | Quem pode |
|---|---|---|
| Título, descrição, categoria, tópicos, páginas | `src/data/materiais.ts` (PR) | quem tem acesso ao git |
| Capa (imagem) | `public/assets/images/materiais/` (PR) | quem tem acesso ao git |
| Categoria nova | `MATERIAL_CATEGORIES` em `src/data/materiais.ts` (PR) | quem tem acesso ao git |
| PDF | `/admin` → aba "Materiais Didáticos" → "Enviar PDF" | quem tem login de admin no site |

### Por que o PDF não vai no repositório

O repositório é público. PDF commitado fica aberto para qualquer pessoa baixar
pelo GitHub, inclusive as apostilas exclusivas de alunos. Por isso o PDF vai
direto para o bucket privado `free-materials` do Supabase, e o aluno baixa por
um link assinado que expira em 60 segundos e só é gerado para quem está logado.

### O que o aluno vê

Só aparece para o aluno a apostila que tem cadastro **e** PDF no bucket. Entre o
merge da PR e o upload do PDF, a apostila fica escondida: não existe estado em
que o aluno clique e o download falhe.

## Passo a passo: apostila nova

### 1. Na PR

**a) Capa.** Salve a imagem em
`public/assets/images/materiais/apostila-NN.webp` (NN = número da apostila).
Mesmo padrão das existentes: **WebP, 480×679 px**, normalmente a primeira
página do PDF. A página mostra só a faixa de cima da capa, então o título da
apostila precisa estar no terço superior da imagem.

**b) Cadastro.** Em `src/data/materiais.ts`, acrescente uma entrada em
`MEMBER_MATERIALS` (exclusivas de alunos):

```ts
export const MEMBER_MATERIALS: MaterialEntry[] = [
  {
    id: "09",                       // continua a numeração; não pode repetir
    category: "trilha",             // id de uma categoria em MATERIAL_CATEGORIES
    volume: "Vol. 5",               // aparece em cima do título: "09 · Vol. 5"
    title: "Título da apostila",
    description:
      "Uma ou duas frases dizendo do que a apostila trata. É o que o aluno lê para decidir qual abrir.",
    topics: [                       // 3 a 5 itens curtos; também entram na busca
      "Primeiro assunto",
      "Segundo assunto",
      "Terceiro assunto",
    ],
    pages: 12,
    filePath: "membros/apostila-09-titulo-curto.pdf", // caminho no bucket; sempre em membros/
    fileName: "Claude-Academy-09-Titulo-Curto.pdf",   // nome do arquivo que o aluno baixa (sem acento/espaço)
    cover: "/assets/images/materiais/apostila-09.webp",
  },
];
```

Não precisa informar o tamanho do arquivo: a página usa o tamanho real do PDF
no bucket.

**c) Confira antes de abrir a PR:**

```bash
npm run test:unit
```

Os testes de `tests/unit/course-materials.test.ts` acusam:

- id repetido;
- capa que não existe em `public/`;
- dois cadastros apontando para o mesmo PDF;
- exclusiva fora de `membros/`;
- apostila sem descrição;
- categoria sem título ou descrição.

Categoria que não existe o próprio TypeScript recusa (e aí o build da Vercel
falha antes de ir para o ar).

### 2. Depois do merge e do deploy

1. Entre em `/admin` com uma conta de admin.
2. Aba **Materiais Didáticos**. A apostila nova aparece com o selo
   **"Falta o PDF"**.
3. Clique em **Enviar PDF** e escolha o arquivo (só PDF, até 50 MB).
4. O selo vira **"No ar"** e a apostila aparece na hora para os alunos, sem
   deploy novo.

## Outras tarefas

**Criar categoria.** Acrescente em `MATERIAL_CATEGORIES`:

```ts
{
  id: "modelos",                    // minúsculo, sem espaço; é o que vai em `category`
  title: "Modelos e templates",
  description: "Uma frase dizendo o que o aluno encontra aqui.",
},
```

A ordem da lista é a ordem na página. Categoria sem apostila não aparece, então
dá para criar antes de ter o material pronto. Cada categoria vira um botão de
filtro no topo da página automaticamente.

**Trocar o PDF de uma apostila.** `/admin` → Materiais Didáticos → **Trocar
PDF**. O painel pede confirmação. Não precisa de PR.

**Corrigir texto, categoria ou capa.** PR editando a entrada em
`src/data/materiais.ts` ou a imagem.

**Tirar uma apostila do ar.** PR removendo a entrada. O PDF continua no bucket,
mas sem cadastro ninguém consegue baixar. Não reaproveite o mesmo `id` nem o
mesmo `filePath` para outra apostila.

**Apostilas gratuitas** (`FREE_MATERIALS`) aparecem em `/materiais`, a página
pública que pede nome e contato antes do download, e também nos Materiais
Didáticos. Para essas, `sizeBytes` é obrigatório porque a página pública mostra
o tamanho fixo.

## Configuração (uma vez, por quem tem acesso ao Supabase)

- O bucket `free-materials` já existe (migration `020_free_materials_bucket.sql`).
  Nada de migration nova.
- As variáveis de ambiente já são as que a produção usa
  (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Para alguém de fora da equipe padrão subir PDFs, libere o e-mail como admin:

  ```bash
  npm run admin:create -- --email nome@escritoriovilasboas.com
  ```

  Só e-mails `@chatjuridico.com.br` ou `@escritoriovilasboas.com` são aceitos.

Quem tem a `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` também pode subir tudo
de uma vez por script: `npm run materiais:upload -- <pasta>`, com um PDF por
apostila nomeado pelo id (`01.pdf`, `09.pdf`…).

## Referência técnica

| Peça | Arquivo |
|---|---|
| Catálogo, categorias, busca e regras | `src/data/materiais.ts` |
| Leitura do bucket e upload assinado | `src/lib/materials/storage.ts` |
| Página do aluno | `src/app/(members)/area-de-membros/materiais/page.tsx` |
| Busca e filtro (client) | `src/components/members/course-materials-browser.tsx` |
| Download do aluno (exige login) | `src/app/api/materiais/alunos/download/route.ts` |
| Aba do admin | `src/components/admin/materials-admin.tsx` |
| API do admin (listar / assinar upload) | `src/app/api/admin/materials/` |
| Testes | `tests/unit/course-materials.test.ts` |

- O PDF vai do navegador direto para o Storage por URL assinada. O arquivo não
  passa pela API, então o limite de ~4,5 MB por requisição da Vercel não se
  aplica.
- O admin só escolhe a apostila, não o caminho: o destino do upload é sempre o
  `filePath` cadastrado no código.
- As apostilas exclusivas não saem pela rota pública `/api/materiais/download`,
  que só atende as gratuitas.
- Se a listagem do bucket falhar, a página do aluno mostra o catálogo inteiro
  em vez de esconder tudo. No pior caso, um download pede para tentar de novo.
