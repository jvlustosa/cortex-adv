import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAdminDate, formatBytes, initialsFromEmail, viewerDisplayName } from "../../src/lib/admin/format.ts";
import {
  lessonEmbedUrl,
  lessonVideo,
  lessonVideoThumbnail,
  normalizeTellaSlug,
  normalizeYoutubeId,
} from "../../src/lib/lessons/video-urls.ts";
import { normalizeSection } from "../../src/lib/admin/normalize-section.ts";

describe("initialsFromEmail", () => {
  it("usa iniciais de nome.sobrenome", () => {
    assert.equal(initialsFromEmail("maria.silva@escritorio.com"), "MS");
  });

  it("cai nos dois primeiros chars do local part", () => {
    assert.equal(initialsFromEmail("joao@x.com"), "JO");
  });
});

describe("viewerDisplayName", () => {
  it("prioriza full_name", () => {
    assert.equal(
      viewerDisplayName({ name: "Maria Silva", email: "m@x.com" }),
      "Maria Silva",
    );
  });

  it("deriva do e-mail sem nome", () => {
    assert.equal(
      viewerDisplayName({ name: null, email: "maria.silva@x.com" }),
      "maria silva",
    );
  });
});

describe("formatAdminDate", () => {
  it("null → traço", () => {
    assert.equal(formatAdminDate(null), "-");
  });
});

describe("formatBytes", () => {
  it("formata B, KB e MB", () => {
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(2048), "2 KB");
    assert.match(formatBytes(2 * 1024 * 1024), /MB$/);
  });
});

describe("lessonVideo", () => {
  it("prioriza Tella", () => {
    const v = lessonVideo({ tella: "abc", youtubeId: "yt" });
    assert.ok(v?.url.includes("tella.tv"));
    assert.equal(v?.label, "Tella");
  });

  it("cai no YouTube sem Tella", () => {
    const v = lessonVideo({ youtubeId: "abc123" });
    assert.ok(v?.url.includes("youtube.com"));
  });
});

describe("lessonVideoThumbnail", () => {
  it("gera CDN Tella", () => {
    const t = lessonVideoThumbnail({ tella: "abc-slug" });
    assert.ok(t?.src.includes("cdn.tella.tv/thumbnails/abc-slug"));
    assert.equal(t?.label, "Tella");
  });

  it("gera img.youtube sem Tella", () => {
    const t = lessonVideoThumbnail({ youtubeId: "abc123" });
    assert.ok(t?.src.includes("i.ytimg.com/vi/abc123"));
    assert.equal(t?.label, "YouTube");
  });

  it("prioriza Tella sobre YouTube", () => {
    const t = lessonVideoThumbnail({ tella: "t", youtubeId: "y" });
    assert.equal(t?.label, "Tella");
  });
});

describe("normalizeTellaSlug", () => {
  it("aceita slug puro", () => {
    assert.equal(normalizeTellaSlug("01-ca-1-slug"), "01-ca-1-slug");
  });

  it("extrai da URL completa", () => {
    assert.equal(
      normalizeTellaSlug("https://www.tella.tv/video/01-ca-1-slug/embed"),
      "01-ca-1-slug",
    );
  });
});

describe("normalizeYoutubeId", () => {
  it("aceita ID puro", () => {
    assert.equal(normalizeYoutubeId("abc123XYZ"), "abc123XYZ");
  });

  it("extrai de watch URL", () => {
    assert.equal(
      normalizeYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });
});

describe("lessonEmbedUrl", () => {
  it("gera embed nocookie para YouTube", () => {
    assert.ok(
      lessonEmbedUrl({ youtubeId: "x" })?.includes("youtube-nocookie.com"),
    );
  });
});

describe("normalizeSection", () => {
  it("aceita slug como moduleId", () => {
    const s = normalizeSection({ slug: "mod-x", title: "Título" });
    assert.equal(s.moduleId, "mod-x");
    assert.equal(s.title, "Título");
    assert.equal(s.comingSoon, false);
  });
});
