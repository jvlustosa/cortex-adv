-- Apostilas gratuitas (/materiais): PDFs no bucket privado 'free-materials'.
-- Sem tabela: o catálogo é estático em src/data/materiais.ts. O download sai
-- por /api/materiais/download com signed URL curto (service role).
-- Upload dos arquivos: `npm run materiais:upload -- <pasta-com-01.pdf..08.pdf>`.

insert into storage.buckets (id, name, public)
values ('free-materials', 'free-materials', false)
on conflict (id) do nothing;
