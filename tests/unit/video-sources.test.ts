import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lessonEmbedUrl,
  lessonVideo,
  lessonVideoSources,
} from "@/lib/lessons/video-urls";

test("sem vídeo: nenhuma fonte", () => {
  assert.deepEqual(lessonVideoSources({}), []);
  assert.deepEqual(lessonVideoSources({ tella: "  ", youtubeId: "" }), []);
});

test("só Tella: uma fonte, sem alternativa", () => {
  const s = lessonVideoSources({ tella: "01-abc" });
  assert.equal(s.length, 1);
  assert.equal(s[0].kind, "tella");
  assert.equal(s[0].embedUrl, "https://www.tella.tv/video/01-abc/embed?b=0&title=0&a=0");
  assert.equal(s[0].watchUrl, "https://www.tella.tv/video/01-abc");
});

test("só YouTube: uma fonte", () => {
  const s = lessonVideoSources({ youtubeId: "dQw4w9WgXcQ" });
  assert.equal(s.length, 1);
  assert.equal(s[0].kind, "youtube");
  assert.equal(s[0].embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  assert.equal(s[0].watchUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

// Regressão: o player descartava o youtubeId quando havia Tella, então uma aula
// com backup configurado ficava sem saída se o Tella falhasse.
test("Tella + YouTube: Tella primeiro, YouTube fica como fallback", () => {
  const s = lessonVideoSources({ tella: "01-abc", youtubeId: "dQw4w9WgXcQ" });
  assert.equal(s.length, 2);
  assert.deepEqual(
    s.map((x) => x.kind),
    ["tella", "youtube"],
  );
});

test("aceita URL colada, não só slug/ID", () => {
  const s = lessonVideoSources({
    tella: "https://www.tella.tv/video/01-abc?t=10",
    youtubeId: "https://youtu.be/dQw4w9WgXcQ",
  });
  assert.equal(s[0].embedUrl, "https://www.tella.tv/video/01-abc/embed?b=0&title=0&a=0");
  assert.equal(s[1].embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
});

test("primária continua sendo o Tella (admin e thumb não mudam)", () => {
  const lesson = { tella: "01-abc", youtubeId: "dQw4w9WgXcQ" };
  assert.equal(lessonVideo(lesson)?.label, "Tella");
  assert.equal(lessonEmbedUrl(lesson), lessonVideoSources(lesson)[0].embedUrl);
});
