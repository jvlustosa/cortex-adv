import { createOgImage, ogSize } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Cadastro — Curso gratuito de Claude para advogados";
export const size = ogSize;
export const contentType = "image/png";

export default function OgImage() {
  return createOgImage({
    tag: "Cortex.adv.br · Cadastro com convite",
    title: "Curso gratuito de Claude para advogados",
    subtitle:
      "Crie sua conta e acesse o material completo: prompts, automações e fluxos para o escritório.",
  });
}
