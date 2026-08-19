/**
 * Como um material de aula é apresentado ao aluno.
 *
 * A decisão sai da extensão, não do content-type: o browser sobe `.md`, `.html`
 * e `.yaml` sem MIME nenhum, e o arquivo acabaria como octet-stream. O
 * content-type só entra como desempate quando a extensão não diz nada.
 */
export type MaterialKind =
  | "markdown"
  | "html"
  | "pdf"
  | "image"
  | "text"
  | "other";

const KIND_BY_EXT: Record<string, MaterialKind> = {
  md: "markdown",
  markdown: "markdown",
  html: "html",
  htm: "html",
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  avif: "image",
  txt: "text",
  csv: "text",
  json: "text",
  yml: "text",
  yaml: "text",
  log: "text",
};

/** Extensão em minúsculas ("" quando o arquivo não tem). Serve pro selo na lista. */
export function materialExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export function materialKind(
  fileName: string,
  contentType: string | null,
): MaterialKind {
  const byExt = KIND_BY_EXT[materialExtension(fileName)];
  if (byExt) return byExt;

  if (contentType === "application/pdf") return "pdf";
  if (contentType === "text/markdown") return "markdown";
  if (contentType === "text/html") return "html";
  if (contentType?.startsWith("image/")) return "image";
  if (contentType?.startsWith("text/")) return "text";
  return "other";
}

/** Abre no visualizador da aula; o resto vira download. */
export function isRenderable(kind: MaterialKind): boolean {
  return kind !== "other";
}

/**
 * HTML "solto" (exportação de editor, trecho colado) não traz `<head>`, então
 * herda o preto-no-branco padrão do browser e destoa do modal escuro. Nesse
 * caso embrulhamos na nossa folha de estilo; documento completo vai como veio.
 */
export function isHtmlFragment(source: string): boolean {
  return !/<!doctype|<html[\s>]|<body[\s>]/i.test(source);
}

/**
 * Proporção da miniatura. Slide deitado e apostila em pé com a mesma moldura
 * ficam ambos errados; o card usa a forma real do material.
 */
export type MaterialAspect = "slide" | "page";

const SLIDE_EXT = new Set(["pptx", "ppt", "key", "odp"]);
/** PDF não diz se é deck ou apostila — o nome do arquivo é o único sinal barato. */
const SLIDE_NAME = /slide|apresenta|deck|pitch/i;

export function materialAspect(
  fileName: string,
  kind: MaterialKind,
): MaterialAspect {
  if (SLIDE_EXT.has(materialExtension(fileName))) return "slide";
  if (kind === "markdown" || kind === "html" || kind === "text") return "page";
  return SLIDE_NAME.test(fileName) ? "slide" : "page";
}

const MAX_EXCERPT = 400;

function collapseLines(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function stripHtml(source: string): string {
  return source
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(
      /<\/(p|div|h[1-6]|li|tr|section|article|header|footer|blockquote)>/gi,
      "\n",
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]*)`/g, "$1");
}

/**
 * Texto cru pra miniatura do card. Não é render: é o suficiente pro aluno
 * reconhecer o material antes de abrir.
 */
export function previewExcerpt(source: string, kind: MaterialKind): string {
  const plain =
    kind === "html"
      ? stripHtml(source)
      : kind === "markdown"
        ? stripMarkdown(source)
        : source;

  const text = collapseLines(plain);
  if (text.length <= MAX_EXCERPT) return text;
  return text.slice(0, MAX_EXCERPT - 1).trimEnd() + "…";
}
