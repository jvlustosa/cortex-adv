/**
 * Teto de upload de material.
 *
 * Os bytes vão do browser direto pro Storage (URL assinada), então o limite de
 * ~4,5 MB por requisição da Vercel não se aplica — quem manda é o limite do
 * bucket no Supabase. Mantemos o número aqui para barrar cedo, com mensagem
 * clara, em vez de deixar o Supabase recusar no meio do envio.
 */
export const MAX_MATERIAL_BYTES = 50 * 1024 * 1024;

export const MAX_MATERIAL_LABEL = "50 MB";
