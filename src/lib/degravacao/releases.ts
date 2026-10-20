/**
 * Versões do plugin Degravação, lidas das Releases do GitHub (repo do autor,
 * Marcos Vilas Boas). A área do produto mostra a versão nova e o que mudou
 * sem a gente republicar nada: o autor solta a release e ela aparece aqui.
 */
export const DEGRAVACAO_REPO = "mcastelan35/degravacao-claude-advogados";

const RELEASES_URL = `https://api.github.com/repos/${DEGRAVACAO_REPO}/releases?per_page=10`;

/** Uma hora: a API sem token tem limite de 60 req/h por IP. */
const REVALIDATE_SECONDS = 3600;

export type DegravacaoRelease = {
  tag: string;
  name: string;
  publishedAt: string;
  /** Notas da release em texto puro (sem marcação markdown). */
  notes: string;
  htmlUrl: string;
  plugin: { fileName: string; url: string; sizeBytes: number } | null;
};

type GithubAsset = { name?: unknown; browser_download_url?: unknown; size?: unknown };
type GithubRelease = {
  tag_name?: unknown;
  name?: unknown;
  published_at?: unknown;
  body?: unknown;
  html_url?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  assets?: unknown;
};

/**
 * Markdown das notas para texto puro. As notas vêm de terceiro: renderizamos
 * como texto (React escapa), nunca como HTML.
 */
export function releaseNotesToText(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findPluginAsset(assets: unknown): DegravacaoRelease["plugin"] {
  if (!Array.isArray(assets)) return null;
  for (const asset of assets as GithubAsset[]) {
    if (
      typeof asset.name === "string" &&
      asset.name.endsWith(".plugin") &&
      typeof asset.browser_download_url === "string"
    ) {
      return {
        fileName: asset.name,
        url: asset.browser_download_url,
        sizeBytes: typeof asset.size === "number" ? asset.size : 0,
      };
    }
  }
  return null;
}

/** Releases publicadas (sem rascunho nem pré-release), mais nova primeiro. */
export function parseReleases(json: unknown): DegravacaoRelease[] {
  if (!Array.isArray(json)) return [];

  return (json as GithubRelease[])
    .filter((r) => r.draft !== true && r.prerelease !== true)
    .filter(
      (r) => typeof r.tag_name === "string" && typeof r.published_at === "string",
    )
    .map((r) => ({
      tag: r.tag_name as string,
      name: typeof r.name === "string" && r.name ? r.name : (r.tag_name as string),
      publishedAt: r.published_at as string,
      notes: typeof r.body === "string" ? releaseNotesToText(r.body) : "",
      htmlUrl: typeof r.html_url === "string" ? r.html_url : "",
      plugin: findPluginAsset(r.assets),
    }))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/**
 * Busca as releases no GitHub. Falha (rede, rate limit) devolve lista vazia:
 * a página mostra o caminho alternativo de instalação em vez de quebrar.
 */
export async function fetchDegravacaoReleases(): Promise<DegravacaoRelease[]> {
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error("[degravacao/releases] GitHub respondeu", res.status);
      return [];
    }
    return parseReleases(await res.json());
  } catch (err) {
    console.error(
      "[degravacao/releases] falha ao buscar",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}
