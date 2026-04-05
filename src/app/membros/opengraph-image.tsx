import { createOgImage, ogSize } from "@/lib/og-image";

export const runtime = "edge";
export const alt =
  "Mini curso Claude para advogados — Skills de IA para o escritório";
export const size = ogSize;
export const contentType = "image/png";

export default function OgImage() {
  return createOgImage({
    tag: "Mini curso gratuito · Claude Cowork",
    title: "Skills de Claude para advogados",
    subtitle:
      "Peças, pesquisa jurídica, automação de rotinas, relatórios e comunicação com clientes — tudo com IA.",
    pills: [
      "Petições",
      "Jurisprudência",
      "Automação",
      "Prazos",
      "Relatórios",
    ],
  });
}
