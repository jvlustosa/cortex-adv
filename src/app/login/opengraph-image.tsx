import { createOgImage, ogSize } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Entrar — Área de membros Cortex.adv.br";
export const size = ogSize;
export const contentType = "image/png";

export default function OgImage() {
  return createOgImage({
    tag: "Cortex.adv.br",
    title: "Área de membros",
    subtitle:
      "Acesse o mini curso de Claude e IA generativa para advogados. Login seguro com e-mail e senha.",
  });
}
