import { createOgImage, ogSize } from "@/lib/og-image";

export const runtime = "edge";
export const alt =
  "Quiz — Quão atualizado você está com IA? | Cortex.adv.br";
export const size = ogSize;
export const contentType = "image/png";

export default function OgImage() {
  return createOgImage({
    tag: "Quiz gratuito · 2 minutos",
    title: "Quão atualizado você está com IA?",
    subtitle:
      "6 perguntas sobre ferramentas, agentes e automação com IA na advocacia. Descubra seu nível.",
    pills: ["Ferramentas", "Agentes de IA", "MCP", "Automação", "Contexto"],
  });
}
