-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Claude Academy — popular a capa (cover_image) dos módulos com as imagens    │
-- │ públicas do repo (as capas das temporadas em /public/assets/images/…).      │
-- │                                                                            │
-- │ Rode no SQL Editor do Supabase (prod). Idempotente e seguro:               │
-- │  • casa por sort_order (0→temporada-0 … 7→temporada-7; ≥8 usa a última);    │
-- │  • NÃO sobrescreve capa custom que você já tenha setado no painel (só       │
-- │    preenche NULL/vazia OU troca uma capa de temporada por outra).           │
-- │ Depois de rodar, o painel /admin (modo COURSE_SOURCE=db) mostra a imagem    │
-- │ certa e você pode trocá-la pelo seletor de capa na edição da seção.         │
-- └──────────────────────────────────────────────────────────────────────────┘

with covers(idx, path) as (
  values
    (0, '/assets/images/temporadas/temporada-0-comece-aqui.png'),
    (1, '/assets/images/temporadas/temporada-1-fundacao-pratica.png'),
    (2, '/assets/images/temporadas/temporada-2-economia-claude.png'),
    (3, '/assets/images/temporadas/temporada-3-projects.png'),
    (4, '/assets/images/temporadas/temporada-4-cowork.png'),
    (5, '/assets/images/temporadas/temporada-5-escritorio-automatico.png'),
    (6, '/assets/images/temporadas/temporada-6-artefatos.png'),
    (7, '/assets/images/temporadas/temporada-7-encerramento.png')
)
update public.modules m
set cover_image = c.path
from covers c
where c.idx = least(m.sort_order, 7)
  and (
    m.cover_image is null
    or m.cover_image = ''
    or m.cover_image like '/assets/images/temporadas/%'  -- troca temporada por temporada; preserva capa custom
  );

-- Confere o resultado (o SQL Editor mostra o retorno do último statement).
select sort_order, slug, title, cover_image
from public.modules
order by sort_order;
