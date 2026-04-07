/**
 * Generates 8 WhatsApp group image variations (640×640 PNG) using Playwright.
 * Run: node scripts/generate-group-images.mjs
 *
 * Output: public/group/<name>.png
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "public/group");

mkdirSync(outDir, { recursive: true });

const S = 640;

// ─── Design tokens ───────────────────────────────────────────────

const T = {
  bg: "#191918",
  surface: "#232322",
  surfaceRaised: "#2a2a28",
  text: "#e8e4dc",
  muted: "#8c8a85",
  accent: "#d4a574",
  accentHover: "#e0b88a",
  border: "#2e2d2b",
};

// ─── Shared HTML head with Google Fonts ──────────────────────────

const htmlHead = `<!DOCTYPE html>
<html><head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${S}px; height: ${S}px; overflow: hidden; font-family: 'DM Sans', sans-serif; }
  .frame {
    width: ${S}px; height: ${S}px; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
</style>
</head><body>`;

// ─── Orb dot generator (JS to run in browser) ───────────────────

const orbScript = `
function drawOrb(canvas, cx, cy, radius, count) {
  const ctx = canvas.getContext('2d');
  const phi_g = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const theta = 2 * Math.PI * i / phi_g;
    const phi = Math.acos(1 - 2 * t);
    const x = cx + radius * Math.sin(phi) * Math.cos(theta);
    const y = cy + radius * Math.cos(phi) * 0.85 + radius * 0.1 * Math.sin(phi) * Math.sin(theta);
    const depth = Math.sin(phi) * Math.sin(theta);
    const norm = (depth + 1) / 2;
    const size = 3 + norm * 8;
    const hue = 28 + (i % 8) * 1.5;
    const sat = 50 + norm * 20;
    const lgt = 42 + norm * 26;
    const alpha = 0.2 + norm * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + hue + ',' + sat + '%,' + lgt + '%,' + alpha + ')';
    ctx.shadowBlur = norm * 6;
    ctx.shadowColor = 'hsla(' + hue + ',60%,55%,' + (alpha * 0.5) + ')';
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawRing(canvas, cx, cy, radius, count) {
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < count; i++) {
    const angle = 2 * Math.PI * i / count;
    const jitter = (Math.sin(i * 3.7) * 0.1 + 1) * radius;
    const x = cx + jitter * Math.cos(angle);
    const y = cy + jitter * Math.sin(angle);
    const size = 4 + Math.abs(Math.sin(i * 1.3)) * 6;
    const hue = 28 + (i % 8) * 1.5;
    const alpha = 0.4 + Math.abs(Math.cos(i * 0.9)) * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + hue + ',60%,58%,' + alpha + ')';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'hsla(' + hue + ',60%,55%,' + (alpha * 0.4) + ')';
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawScatter(canvas, count, seed) {
  const ctx = canvas.getContext('2d');
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const size = 2 + rand() * 5;
    const hue = 28 + rand() * 10;
    const alpha = 0.08 + rand() * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + hue + ',55%,55%,' + alpha + ')';
    ctx.fill();
  }
}

function drawCircularText(ctx, text, cx, cy, radius, startAngle, letterSpacing) {
  ctx.save();
  const chars = text.split('');
  const totalAngle = letterSpacing * (chars.length - 1);
  let angle = startAngle - totalAngle / 2;
  chars.forEach(ch => {
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += letterSpacing;
  });
  ctx.restore();
}
`;

// ─── Variation definitions ───────────────────────────────────────

const variations = [
  // 1. Classic: big orb center + CORTEX below
  {
    name: "01-classic",
    html: () => `${htmlHead}
      <div class="frame" style="background: linear-gradient(135deg, ${T.bg}, ${T.surface});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:absolute;bottom:100px;font-size:64px;font-weight:700;color:${T.text};letter-spacing:0.18em;">CORTEX</div>
      </div>
      <script>${orbScript}
        const c = document.getElementById('c');
        drawOrb(c, 320, 230, 180, 140);
      </script></body></html>`,
  },

  // 2. Orb replaces the "O" in CORTEX
  {
    name: "02-orb-letter",
    html: () => `${htmlHead}
      <div class="frame" style="background: linear-gradient(135deg, ${T.bg}, ${T.surface});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="display:flex;align-items:center;gap:0;position:relative;z-index:1;">
          <span style="font-size:96px;font-weight:700;color:${T.text};letter-spacing:0.06em;">C</span>
          <canvas id="orb" width="90" height="90" style="margin:0 -2px;"></canvas>
          <span style="font-size:96px;font-weight:700;color:${T.text};letter-spacing:0.06em;">RTEX</span>
        </div>
      </div>
      <script>${orbScript}
        drawScatter(document.getElementById('c'), 35, 77);
        drawOrb(document.getElementById('orb'), 45, 45, 42, 80);
      </script></body></html>`,
  },

  // 3. Minimal: small orb + large text + subtitle
  {
    name: "03-minimal",
    html: () => `${htmlHead}
      <div class="frame" style="background: linear-gradient(135deg, ${T.bg}, ${T.surface});flex-direction:column;gap:16px;">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <canvas id="orb" width="140" height="140"></canvas>
          <div style="font-size:84px;font-weight:700;color:${T.text};letter-spacing:0.22em;margin-top:8px;">CORTEX</div>
          <div style="font-size:15px;font-weight:400;color:${T.muted};letter-spacing:0.3em;">IA PARA ADVOGADOS</div>
        </div>
      </div>
      <script>${orbScript}
        drawOrb(document.getElementById('orb'), 70, 70, 65, 60);
      </script></body></html>`,
  },

  // 4. Full bleed: dense orb fills canvas + text overlay
  {
    name: "04-full-bleed",
    html: () => `${htmlHead}
      <div class="frame" style="background: linear-gradient(135deg, ${T.bg}, ${T.surface});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:relative;z-index:1;font-size:80px;font-weight:700;color:${T.text};letter-spacing:0.15em;text-shadow:0 0 60px ${T.bg}, 0 0 30px ${T.bg};">CORTEX</div>
      </div>
      <script>${orbScript}
        const c = document.getElementById('c');
        drawOrb(c, 320, 320, 310, 220);
      </script></body></html>`,
  },

  // 5. Double ring around text
  {
    name: "05-ring",
    html: () => `${htmlHead}
      <div class="frame" style="background: radial-gradient(circle at 50% 50%, ${T.surface}, ${T.bg});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:relative;z-index:1;font-size:56px;font-weight:700;color:${T.text};letter-spacing:0.2em;">CORTEX</div>
      </div>
      <script>${orbScript}
        const c = document.getElementById('c');
        drawRing(c, 320, 320, 245, 65);
        drawRing(c, 320, 320, 200, 40);
      </script></body></html>`,
  },

  // 6. Split: orb left, vertical text right
  {
    name: "06-split",
    html: () => `${htmlHead}
      <div class="frame" style="background: ${T.bg};">
        <div style="position:absolute;left:0;top:0;width:320px;height:${S}px;background:linear-gradient(180deg,${T.surface},${T.bg});"></div>
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:absolute;left:320px;top:0;width:1px;height:${S}px;background:${T.border};"></div>
        <div style="position:absolute;right:50px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:1;">
          ${"CORTEX".split("").map(ch => `<span style="font-size:58px;font-weight:700;color:${T.text};line-height:1;">${ch}</span>`).join("")}
        </div>
      </div>
      <script>${orbScript}
        drawOrb(document.getElementById('c'), 160, 320, 155, 110);
      </script></body></html>`,
  },

  // 7. Accent bar + stacked letters + circular text arc
  {
    name: "07-accent-arc",
    html: () => `${htmlHead}
      <div class="frame" style="background: linear-gradient(135deg, ${T.bg}, ${T.surface});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:absolute;left:80px;top:50%;transform:translateY(-50%);width:4px;height:400px;background:linear-gradient(180deg,transparent,${T.accent},transparent);border-radius:2px;"></div>
        <div style="position:absolute;left:108px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px;z-index:1;">
          ${"CORTEX".split("").map((ch, i) => `<span style="font-size:72px;font-weight:700;color:${i === 0 ? T.accent : T.text};line-height:1.05;">${ch}</span>`).join("")}
        </div>
      </div>
      <script>${orbScript}
        const c = document.getElementById('c');
        drawOrb(c, 470, 320, 130, 90);
        drawScatter(c, 40, 123);
      </script></body></html>`,
  },

  // 8. Badge: circular frame + ring halo + circular text arc
  {
    name: "08-badge",
    html: () => `${htmlHead}
      <div class="frame" style="background: radial-gradient(circle at 50% 50%, ${T.surface}, ${T.bg});">
        <canvas id="c" width="${S}" height="${S}" style="position:absolute;top:0;left:0;"></canvas>
        <div style="position:relative;z-index:1;width:340px;height:340px;border-radius:50%;border:2px solid ${T.border};background:radial-gradient(circle,${T.surface},${T.bg});display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-size:52px;font-weight:700;color:${T.text};letter-spacing:0.2em;">CORTEX</div>
          <div style="font-size:13px;font-weight:400;color:${T.accent};letter-spacing:0.35em;margin-top:12px;">IA PARA ADVOGADOS</div>
        </div>
      </div>
      <script>${orbScript}
        const c = document.getElementById('c');
        const ctx = c.getContext('2d');
        drawRing(c, 320, 320, 265, 55);
        drawRing(c, 320, 320, 290, 30);
        // circular text arc at top
        ctx.font = '500 11px "DM Sans"';
        ctx.fillStyle = '${T.muted}';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawCircularText(ctx, 'INTELIGÊNCIA ARTIFICIAL', 320, 320, 230, -Math.PI/2, 0.065);
        // circular text arc at bottom
        drawCircularText(ctx, 'ADVOCACIA DO FUTURO', 320, 320, 230, Math.PI/2, 0.07);
      </script></body></html>`,
  },
];

// ─── Render pipeline ─────────────────────────────────────────────

async function main() {
  console.log("Launching browser…");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: S, height: S },
    deviceScaleFactor: 2,
  });

  console.log(`Generating ${variations.length} group images…\n`);

  for (const { name, html } of variations) {
    try {
      const page = await context.newPage();
      await page.setContent(html(), { waitUntil: "networkidle" });
      // Extra wait for fonts
      await page.waitForTimeout(500);
      const out = resolve(outDir, `${name}.png`);
      const buf = await page.screenshot({ type: "png" });
      // Resize from 2x retina to 640px and optimize
      const sharp = (await import("sharp")).default;
      await sharp(buf).resize(S, S).png({ quality: 90, compressionLevel: 9 }).toFile(out);
      const { size } = await import("fs").then(fs => fs.statSync(out));
      console.log(`  ✓ ${name}.png (${(size / 1024).toFixed(0)} KB)`);
      await page.close();
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone! Files in public/group/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
