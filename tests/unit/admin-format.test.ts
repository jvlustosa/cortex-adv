import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAdminDate, formatBytes } from "../../src/lib/admin/format.ts";
import {
  lessonEmbedUrl,
  lessonVideo,
} from "../../src/lib/lessons/video-urls.ts";
import { normalizeSection } from "../../src/lib/admin/normalize-section.ts";

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
