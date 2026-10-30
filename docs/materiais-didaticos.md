# Materiais Didáticos — como cadastrar apostilas

Seção da área de membros com as apostilas do curso em PDF, separadas por
categoria, com busca: `/area-de-membros/materiais`. As apostilas gratuitas
aparecem também na página pública `/materiais`, que pede nome e contato antes
do download.

## Como funciona, em uma frase

Tudo se faz pelo **/admin**, aba **"Materiais Didáticos"**: cadastrar, editar,
excluir, enviar o PDF e a capa. Não precisa de PR nem de deploy. Só a lista de
**categorias** continua no código.

| O quê | Onde |
|---|---|
| Título, volume, descrição, tópicos, páginas, categoria, gratuita/exclusiva | `/admin` → Materiais Didáticos → **Nova apostila** / **Editar** |
| PDF | `/admin` → **Enviar PDF** / **Trocar PDF** |
| Capa | `/admin` → **Enviar capa** / **Trocar capa** |
| Excluir | `/admin` → ícone da lixeira |
| Categoria nova | `MATERIAL_CATEGORIES` em `src/data/materiais.ts` (PR) |

### Onde ficam os dados

Não há tabela no banco. Tudo fica no bucket privado `free-materials` do
Supabase, que já existia para os PDFs:

- `catalogo.json`: o cadastro de todas as apostilas;
- os PDFs (raiz para as gratuitas, `membros/` para as exclusivas);
- `capas/`: as capas enviadas pelo admin.

Enquanto ninguém salvou nada pelo admin, o `catalogo.json` não existe e vale o
catálogo inicial de `src/data/materiais.ts` (as 8 apostilas originais). O
primeiro salvamento grava a lista inteira no bucket, e daí em diante **editar
`src/data/materiais.ts` não muda mais o site**: o que vale é o admin.

### Por que o PDF não vai no repositório

O repositório é público. PDF commitado fica aberto para qualquer pessoa baixar
pelo GitHub, inclusive as apostilas exclusivas de alunos. Por isso o PDF vai
direto para o bucket privado, e o download sai por um link assinado que expira
em 60 segundos.

### O que o aluno vê

Só aparece a apostila que tem cadastro **e** PDF no bucket. Entre o cadastro e
o upload do PDF ela fica escondida: não existe estado em que o aluno clique e o
download falhe.

- **Exclusiva**: só na área de membros; o download exige login.
- **Gratuita**: na área de membros e em `/materiais`. A rota pública de
  download recusa qualquer apostila marcada como exclusiva.

## Passo a passo: apostila nova

1. Entre em `/admin` com uma conta de admin, aba **Materiais Didáticos**.
2. Clique em **Nova apostila** e preencha:
   - **Título** e **volume** (o volume aparece em cima do título: "09 · Vol. 5");
   - **Categoria** e **acesso** (exclusiva ou gratuita);
   - **Páginas**;
   - **Descrição**: uma ou duas frases dizendo do que a apostila trata. É o que
     o aluno lê para decidir qual abrir;
   - **Tópicos**: um por linha, de 3 a 5. Também entram na busca;
   - **PDF** e **capa**, se já tiver. Dá para mandar depois, na linha da tabela.
3. **Cadastrar apostila**. O número sai sozinho, continuando a sequência
   (número de apostila excluída não é reaproveitado).
4. Com o PDF enviado, o selo vira **"No ar"** e a apostila aparece na hora.

**Capa:** WebP, PNG ou JPG, até 5 MB, em pé. O padrão das existentes é
**480×679 px**, normalmente a primeira página do PDF. A página mostra só a
faixa de cima da capa, então o título precisa estar no terço superior da
imagem. Sem capa, o card mostra um bloco com o título.

## Outras tarefas

**Editar texto, categoria ou acesso.** **Editar** na linha da apostila. Trocar
o título muda também o nome do arquivo que o aluno baixa; o PDF continua no
mesmo lugar do bucket.

**Trocar o PDF ou a capa.** Botões na linha da apostila. A capa antiga é
apagada do bucket.

**Excluir.** Lixeira na linha. A apostila sai do ar na hora e o PDF e a capa
são apagados do bucket. Não dá para desfazer: para voltar, cadastre de novo.

**Criar categoria.** Acrescente em `MATERIAL_CATEGORIES`, em
`src/data/materiais.ts` (PR):

```ts
{
  id: "modelos",                    // minúsculo, sem espaço
  title: "Modelos e templates",
  description: "Uma frase dizendo o que o aluno encontra aqui.",
},
```

Depois do deploy ela aparece no seletor do admin. A ordem da lista é a ordem
na página. Categoria sem apostila não aparece. **Não remova categoria em uso**:
as apostilas dela somem da página até serem movidas para outra.

## Cuidados

- **Dois admins ao mesmo tempo.** O cadastro é um arquivo só; quem salva por
  último vence. Se duas pessoas editarem ao mesmo tempo, uma pode desfazer a
  edição da outra. Combinem quem mexe.
- **Página pública.** `/materiais` é refeita na hora quando o admin salva algo,
  e de qualquer forma a cada 5 minutos.
- **Script de upload em lote** (`npm run materiais:upload -- <pasta>`, para
  quem tem a `SUPABASE_SERVICE_ROLE_KEY`): sobe os PDFs do catálogo inicial do
  código, um por id (`01.pdf`…`08.pdf`). Não enxerga as apostilas cadastradas
  pelo admin; para essas, use o admin.

## Configuração

Nada a configurar. O bucket `free-materials` já existe (migration
`020_free_materials_bucket.sql`) e as variáveis de ambiente são as que a
produção já usa (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

Para liberar alguém como admin:

```bash
npm run admin:create -- --email nome@escritoriovilasboas.com
```

Só e-mails `@chatjuridico.com.br` ou `@escritoriovilasboas.com` são aceitos.

## Referência técnica

| Peça | Arquivo |
|---|---|
| Categorias, catálogo inicial, busca e agrupamento | `src/data/materiais.ts` |
| Regras do cadastro (validação, numeração, caminhos, JSON) | `src/lib/materials/catalog-rules.ts` |
| Leitura e gravação no bucket | `src/lib/materials/storage.ts` |
| Aba do admin | `src/components/admin/materials-admin.tsx` |
| API do admin (listar, criar, editar, excluir / assinar upload) | `src/app/api/admin/materials/` |
| Página do aluno | `src/app/(members)/area-de-membros/materiais/page.tsx` |
| Página pública | `src/app/materiais/page.tsx` |
| Download do aluno (exige login) / público (só gratuitas) | `src/app/api/materiais/alunos/download/`, `src/app/api/materiais/download/` |
| Capas enviadas pelo admin | `src/app/api/materiais/capa/[file]/route.ts` |
| Testes | `tests/unit/course-materials.test.ts` |

- PDF e capa vão do navegador direto para o Storage por URL assinada. O
  arquivo não passa pela API, então o limite de ~4,5 MB por requisição da
  Vercel não se aplica.
- O admin não escolhe caminho: o servidor define onde cada PDF e cada capa
  ficam, e só aceita capa com o número da própria apostila.
- Se a leitura do `catalogo.json` falhar, as páginas dão erro em vez de cair no
  catálogo antigo, que faria reaparecer apostila já excluída. Se só a listagem
  dos PDFs falhar, a página mostra o catálogo inteiro; no pior caso, um
  download pede para tentar de novo.
