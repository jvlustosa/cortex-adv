-- Ordena aulas em runtime (reorder por arrastar no painel) e sustenta aulas
-- criadas no painel (linhas de lesson_overrides sem par no catálogo).

alter table public.lesson_overrides
  add column if not exists order_index integer;

create index if not exists lesson_overrides_module_order_idx
  on public.lesson_overrides (module_id, order_index);
