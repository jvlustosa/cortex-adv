-- "Em breve" (coming soon) como estado nativo do módulo. Um módulo com
-- coming_soon = true aparece na seção "Sessões em breve" da área de membros
-- (card travado, sem aulas) e some da grade de módulos ao vivo. Gerido pelo
-- painel admin (checkbox "Em breve") — substitui a lista hardcoded do roteiro
-- (curso-trilha-public.ts) para os membros. Aplicar à mão no SQL editor do
-- Supabase (não há runner automático).

alter table public.modules
  add column if not exists coming_soon boolean not null default false;

comment on column public.modules.coming_soon is
  'true = módulo em breve (card travado nos membros, gerido pelo painel).';
