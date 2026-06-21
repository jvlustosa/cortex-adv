/**
 * Generates static OG images (1200×630 PNG) for all pages.
 * Run: node scripts/generate-og-images.mjs
 * Requires: satori + sharp (devDependencies)
 *
 * Output: public/og/<page>.png
 */

import satori from "satori";
import sharp from "sharp";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "public/og");

mkdirSync(outDir, { recursive: true });

// ─── Design tokens ───────────────────────────────────────────────

const T = {
  bg: "#0a0a0f",
  surface: "rgba(255, 255, 255, 0.04)",
  text: "#e4e4e7",
  muted: "#a1a1aa",
  accent: "#d97757",
  border: "rgba(255, 255, 255, 0.08)",
};

const W = 1200;
const H = 630;

// Marca do Claude (Bootstrap Icons bi-claude, 16×16) — mesma usada no app.
const CLAUDE_MARK_PATH =
  "m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z";

// ─── Font loading ────────────────────────────────────────────────

async function loadGoogleFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  // UA neutro (curl): o Google Fonts serve TTF, que o satori/opentype parseia.
  // Um UA de browser moderno devolveria woff2 (não suportado) e quebraria o build.
  const css = await fetch(url, {
    headers: { "User-Agent": "curl/8.0" },
  }).then((r) => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error(`Font not found: ${family} ${weight}`);
  const buf = await fetch(match[1]).then((r) => r.arrayBuffer());
  return Buffer.from(buf);
}

// Capa 3:4 da temporada (1024×1365) recortada para o quadro landscape do OG,
// embarcada como data URI pra ser desenhada como <img> no satori.
async function coverDataUri(file) {
  const src = resolve(root, "public/assets/images/temporadas", file);
  const buf = await sharp(readFileSync(src))
    .resize(W, H, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// Preenchido em main() antes da renderização (build() roda depois).
const COVERS = {};

// ─── Shared components (satori virtual DOM) ──────────────────────

function glow(top = -120, right = -80, size = 500, alpha = 0.15) {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: `${top}px`,
        right: `${right}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(212,165,116,${alpha}) 0%, transparent 70%)`,
      },
    },
  };
}

function tag(text) {
  return {
    type: "div",
    props: {
      style: {
        fontSize: "18px",
        color: T.accent,
        letterSpacing: "0.05em",
        fontWeight: 500,
      },
      children: text,
    },
  };
}

function title(text, fontSize = 56) {
  return {
    type: "div",
    props: {
      style: {
        marginTop: "24px",
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color: T.text,
        lineHeight: 1.1,
        maxWidth: "900px",
      },
      children: text,
    },
  };
}

function subtitle(text) {
  return {
    type: "div",
    props: {
      style: {
        marginTop: "20px",
        fontSize: "26px",
        color: T.muted,
        lineHeight: 1.4,
        maxWidth: "700px",
      },
      children: text,
    },
  };
}

function pills(items) {
  if (!items || items.length === 0) return null;
  return {
    type: "div",
    props: {
      style: { display: "flex", gap: "12px", marginTop: "36px", flexWrap: "wrap" },
      children: items.map((s) => ({
        type: "div",
        props: {
          style: {
            padding: "8px 20px",
            borderRadius: "100px",
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.accent,
            fontSize: "16px",
            fontWeight: 500,
          },
          children: s,
        },
      })),
    },
  };
}

function footer() {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        bottom: "40px",
        left: "80px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "20px",
        color: T.muted,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: T.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.bg,
              fontWeight: 700,
              fontSize: "16px",
            },
            children: "C",
          },
        },
        { type: "span", props: { children: "claudeacademy.chatjuridico.com.br" } },
      ],
    },
  };
}

function orbDots() {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: "60px",
        right: "80px",
        display: "flex",
        flexWrap: "wrap",
        width: "180px",
        height: "180px",
        gap: "8px",
        opacity: 0.6,
      },
      children: Array.from({ length: 36 }, (_, i) => ({
        type: "div",
        props: {
          style: {
            width: `${6 + (i % 5) * 2}px`,
            height: `${6 + (i % 5) * 2}px`,
            borderRadius: "50%",
            background: `hsla(${28 + (i % 8) * 2}, ${50 + (i % 6) * 5}%, ${45 + (i % 7) * 4}%, ${0.3 + (i % 5) * 0.15})`,
          },
        },
      })),
    },
  };
}

function container(children) {
  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        background: `linear-gradient(135deg, ${T.bg} 0%, ${T.surface} 100%)`,
        fontFamily: "DM Sans, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      },
      children: children.filter(Boolean),
    },
  };
}

// ─── Minimal brand card (default OG) ─────────────────────────────

function claudeMark(size, color) {
  return {
    type: "svg",
    props: {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      children: { type: "path", props: { d: CLAUDE_MARK_PATH, fill: color } },
    },
  };
}

function markTile() {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "176px",
        height: "176px",
        borderRadius: "38px",
        background: "rgba(217, 119, 87, 0.10)",
        border: "1px solid rgba(217, 119, 87, 0.35)",
        boxShadow: "0 24px 80px rgba(217, 119, 87, 0.18)",
      },
      children: claudeMark(96, T.accent),
    },
  };
}

function centeredText(text, style) {
  return { type: "div", props: { style, children: text } };
}

function minimalContainer(children) {
  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 36%, #16100c 0%, ${T.bg} 62%)`,
        fontFamily: "DM Sans, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      },
      children: children.filter(Boolean),
    },
  };
}

// ─── Card com capa de temporada ao fundo ─────────────────────────

// Capa full-bleed + gradiente de legibilidade; texto ancorado embaixo,
// onde o gradiente é mais escuro. Mantém o ponto focal coral visível no meio.
function coverCard(coverUri, children) {
  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 80px 64px",
        position: "relative",
        overflow: "hidden",
        background: T.bg,
        fontFamily: "DM Sans, system-ui, sans-serif",
        textAlign: "center",
      },
      children: [
        {
          type: "img",
          props: {
            src: coverUri,
            width: W,
            height: H,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: `${W}px`,
              height: `${H}px`,
              objectFit: "cover",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: `${W}px`,
              height: `${H}px`,
              background:
                "linear-gradient(180deg, rgba(10,10,15,0.45) 0%, rgba(10,10,15,0.05) 32%, rgba(10,10,15,0.78) 100%)",
            },
          },
        },
        ...children.filter(Boolean),
      ],
    },
  };
}

// ─── Page definitions ────────────────────────────────────────────

const pages = [
  {
    name: "default",
    build: () =>
      coverCard(COVERS.default, [
        centeredText("Claude Academy", {
          fontFamily: "Instrument Serif, Georgia, serif",
          fontSize: "96px",
          color: T.text,
          lineHeight: 1,
        }),
        centeredText("by Chat Jurídico", {
          marginTop: "12px",
          fontSize: "30px",
          color: T.muted,
          letterSpacing: "0.01em",
        }),
        centeredText("Claude para advogados — do primeiro prompt à peça pronta", {
          marginTop: "26px",
          fontSize: "26px",
          color: T.accent,
          fontWeight: 500,
        }),
        centeredText("claudeacademy.chatjuridico.com.br", {
          marginTop: "22px",
          fontSize: "22px",
          color: "rgba(228, 228, 231, 0.75)",
        }),
      ]),
  },
  {
    name: "home",
    build: () =>
      container([
        glow(-120, -80, 500, 0.15),
        orbDots(),
        tag("Mini curso gratuito + Comunidade no WhatsApp"),
        title("IA generativa para advogados", 64),
        subtitle(
          "Aprenda a usar o Claude no seu escritório — prompts, automações e fluxos completos"
        ),
        pills([
          "Geração de peças",
          "Pesquisa jurídica",
          "Automação",
          "Relatórios",
          "Prazos",
        ]),
        footer(),
      ]),
  },
  {
    name: "quiz",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Quiz gratuito · 2 minutos"),
        title("Quão atualizado você está com IA?"),
        subtitle(
          "Perguntas sobre ferramentas, agentes e automação com IA na advocacia. Descubra seu nível."
        ),
        pills(["Ferramentas", "Agentes de IA", "MCP", "Automação", "Contexto"]),
        footer(),
      ]),
  },
  {
    name: "login",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Cortex.adv.br"),
        title("Área de membros"),
        subtitle(
          "Acesse o mini curso de Claude e IA generativa para advogados. Login seguro com e-mail e senha."
        ),
        footer(),
      ]),
  },
  {
    name: "signup",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Cortex.adv.br · Cadastro com convite"),
        title("Curso gratuito de Claude para advogados"),
        subtitle(
          "Crie sua conta e acesse o material completo: prompts, automações e fluxos para o escritório."
        ),
        footer(),
      ]),
  },
  {
    name: "membros",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Mini curso gratuito · Claude Cowork"),
        title("Skills de Claude para advogados"),
        subtitle(
          "Peças, pesquisa jurídica, automação de rotinas, relatórios e comunicação com clientes — tudo com IA."
        ),
        pills(["Petições", "Jurisprudência", "Automação", "Prazos", "Relatórios"]),
        footer(),
      ]),
  },
];

// ─── Render pipeline ─────────────────────────────────────────────

async function main() {
  console.log("Loading fonts…");

  const [dmSansRegular, dmSansBold, instrumentSerif] = await Promise.all([
    loadGoogleFont("DM Sans", 400),
    loadGoogleFont("DM Sans", 700),
    loadGoogleFont("Instrument Serif", 400),
  ]);

  const fonts = [
    { name: "DM Sans", data: dmSansRegular, weight: 400, style: "normal" },
    { name: "DM Sans", data: dmSansBold, weight: 700, style: "normal" },
    { name: "Instrument Serif", data: instrumentSerif, weight: 400, style: "normal" },
  ];

  console.log("Loading season cover…");
  COVERS.default = await coverDataUri("temporada-1-fundacao-pratica.png");

  console.log(`Generating ${pages.length} OG images…\n`);

  await Promise.all(
    pages.map(async ({ name, build }) => {
      const svg = await satori(build(), { width: W, height: H, fonts });
      const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
      const out = resolve(outDir, `${name}.png`);
      writeFileSync(out, png);
      const kb = (png.length / 1024).toFixed(0);
      console.log(`  ✓ ${name}.png (${kb} KB)`);
    })
  );

  console.log(`\nDone! Files in public/og/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
