import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReleases, releaseNotesToText } from "@/lib/degravacao/releases";

const release = (over: Record<string, unknown>) => ({
  tag_name: "v1.0.0",
  name: "Degravação 1.0.0",
  published_at: "2026-10-19T10:00:00Z",
  body: "",
  html_url: "https://github.com/x/y/releases/tag/v1.0.0",
  draft: false,
  prerelease: false,
  assets: [],
  ...over,
});

test("parseReleases: ignora rascunho e pré-release, mais nova primeiro", () => {
  const parsed = parseReleases([
    release({ tag_name: "v1.0.0" }),
    release({ tag_name: "v1.2.0-beta", prerelease: true }),
    release({ tag_name: "v1.3.0", draft: true }),
    release({ tag_name: "v1.1.0", published_at: "2026-10-20T00:35:57Z" }),
  ]);
  assert.deepEqual(
    parsed.map((r) => r.tag),
    ["v1.1.0", "v1.0.0"],
  );
});

test("parseReleases: acha o asset .plugin e ignora os outros", () => {
  const [parsed] = parseReleases([
    release({
      assets: [
        { name: "source.zip", browser_download_url: "https://x/source.zip", size: 10 },
        {
          name: "degravacao-1.0.0.plugin",
          browser_download_url: "https://x/degravacao-1.0.0.plugin",
          size: 123789,
        },
      ],
    }),
  ]);
  assert.deepEqual(parsed.plugin, {
    fileName: "degravacao-1.0.0.plugin",
    url: "https://x/degravacao-1.0.0.plugin",
    sizeBytes: 123789,
  });
});

test("parseReleases: sem .plugin, plugin é null; resposta inválida vira lista vazia", () => {
  assert.equal(parseReleases([release({})])[0].plugin, null);
  assert.deepEqual(parseReleases({ message: "API rate limit exceeded" }), []);
  assert.deepEqual(parseReleases(null), []);
});

test("releaseNotesToText: tira marcação markdown, mantém o texto", () => {
  const text = releaseNotesToText(
    "## Como instalar\r\n\r\n\r\n**Pelo arquivo:** baixe o `x.plugin` em [Assets](https://x).\n- item",
  );
  assert.equal(text, "Como instalar\n\nPelo arquivo: baixe o x.plugin em Assets.\n• item");
});
