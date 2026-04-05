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
  bg: "#191918",
  surface: "#232322",
  text: "#e8e4dc",
  muted: "#8c8a85",
  accent: "#d4a574",
  border: "#2e2d2b",
};

const W = 1200;
const H = 630;

// ─── Font loading ────────────────────────────────────────────────

async function loadGoogleFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  }).then((r) => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error(`Font not found: ${family} ${weight}`);
  const buf = await fetch(match[1]).then((r) => r.arrayBuffer());
  return Buffer.from(buf);
}

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
        { type: "span", props: { children: "cortex.adv.br" } },
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

// ─── Page definitions ────────────────────────────────────────────

const pages = [
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

  const [dmSansRegular, dmSansBold] = await Promise.all([
    loadGoogleFont("DM Sans", 400),
    loadGoogleFont("DM Sans", 700),
  ]);

  const fonts = [
    { name: "DM Sans", data: dmSansRegular, weight: 400, style: "normal" },
    { name: "DM Sans", data: dmSansBold, weight: 700, style: "normal" },
  ];

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
