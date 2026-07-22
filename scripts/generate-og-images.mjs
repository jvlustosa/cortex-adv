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

const LOGO_SRC = resolve(
  root,
  "public/assets/images/claude-hub/claude-para-advogados-academy.png",
);

// Preenchido em main() antes da renderização.
let LOGO_URI = "";

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

async function logoDataUri(size = 512) {
  const buf = await sharp(readFileSync(LOGO_SRC))
    .resize(size, size, { fit: "cover", position: "centre" })
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
        fontSize: "22px",
        color: T.accent,
        letterSpacing: "0.05em",
        fontWeight: 600,
      },
      children: text,
    },
  };
}

function title(text, fontSize = 70) {
  return {
    type: "div",
    props: {
      style: {
        marginTop: "24px",
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color: T.text,
        lineHeight: 1.08,
        maxWidth: "920px",
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
        marginTop: "22px",
        fontSize: "32px",
        color: T.muted,
        lineHeight: 1.35,
        maxWidth: "760px",
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
            padding: "10px 22px",
            borderRadius: "100px",
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.accent,
            fontSize: "19px",
            fontWeight: 600,
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
        gap: "14px",
        fontSize: "24px",
        color: T.muted,
      },
      children: [
        {
          type: "img",
          props: {
            src: LOGO_URI,
            width: 44,
            height: 44,
            style: {
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              objectFit: "cover",
              boxShadow: "0 8px 24px rgba(217, 119, 87, 0.28)",
            },
          },
        },
        { type: "span", props: { children: "claudeacademy.chatjuridico.com.br" } },
      ],
    },
  };
}

function floatingLogo(size = 132, top = 44, right = 64) {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: `${top}px`,
        right: `${right}px`,
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        borderRadius: "28px",
        overflow: "hidden",
        border: "2px solid rgba(217, 119, 87, 0.42)",
        boxShadow:
          "0 22px 56px rgba(217, 119, 87, 0.34), 0 8px 24px rgba(0, 0, 0, 0.45)",
      },
      children: {
        type: "img",
        props: {
          src: LOGO_URI,
          width: size,
          height: size,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
          },
        },
      },
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
        // Sólido, não linear-gradient: satori 0.26 tem um bug de render em que
        // um background gradient no container "vaza" glifos fantasmas por cima
        // do texto (satori/satori#527-like) — reproduzido isolado, some com bg
        // sólido, sobrevive à troca do rasterizador (sharp -> resvg). O glow()
        // radial decorativo não aciona o bug, então continua normal.
        background: T.bg,
        fontFamily: "DM Sans, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      },
      children: [...children.filter(Boolean), floatingLogo()],
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
        floatingLogo(148, 40, 56),
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
          fontSize: "108px",
          color: T.text,
          lineHeight: 1,
        }),
        centeredText("by Chat Jurídico", {
          marginTop: "14px",
          fontSize: "34px",
          color: T.muted,
          letterSpacing: "0.01em",
        }),
        centeredText("Claude para advogados — do primeiro prompt à peça pronta", {
          marginTop: "28px",
          fontSize: "30px",
          color: T.accent,
          fontWeight: 600,
        }),
        centeredText("claudeacademy.chatjuridico.com.br", {
          marginTop: "24px",
          fontSize: "26px",
          color: "rgba(228, 228, 231, 0.75)",
        }),
      ]),
  },
  {
    name: "home",
    build: () =>
      container([
        glow(-120, -80, 500, 0.15),
        tag("Curso Claude Cowork + Comunidade no WhatsApp"),
        title("IA generativa para advogados", 76),
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
        tag("Quiz · 2 minutos"),
        title("Quão atualizado você está com IA?"),
        subtitle(
          "Perguntas sobre ferramentas, agentes e automação com IA na advocacia. Descubra seu nível."
        ),
        pills(["Ferramentas", "Agentes de IA", "MCP", "Automação", "Contexto"]),
        footer(),
      ]),
  },
  {
    name: "simulador-custo-claude",
    build: () =>
      container([
        glow(-100, -60, 420, 0.14),
        tag("Simulador gratuito · Claude para advogados"),
        title("Quanto custa essa peça?"),
        subtitle(
          "Calcule custo por requisição e projeção mensal — Haiku, Sonnet 5, Opus 4.8 e Fable 5 com Batch API e cache."
        ),
        pills(["MTok", "Tokens", "Petição", "Parecer", "Autos", "Batch API"]),
        footer(),
      ]),
  },
  {
    name: "login",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Claude Academy"),
        title("Área de membros"),
        subtitle(
          "Acesse o mini curso de Claude e IA generativa para advogados. Login só por link de acesso no e-mail, sem senha."
        ),
        footer(),
      ]),
  },
  {
    name: "signup",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Claude Academy · Convite de acesso"),
        title("Seu convite para o curso de Claude"),
        subtitle(
          "Cadastro com convite: crie sua conta e acesse a trilha completa, prompts e automações para o escritório."
        ),
        footer(),
      ]),
  },
  {
    name: "membros",
    build: () =>
      container([
        glow(-100, -60, 400, 0.12),
        tag("Curso Claude Cowork"),
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

  console.log("Loading brand assets…");
  LOGO_URI = await logoDataUri();
  COVERS.default = await coverDataUri("temporada-1-fundacao-pratica.png");

  console.log(`Generating ${pages.length} OG images…\n`);

  // Sequencial, não Promise.all: o layout engine (yoga-wasm) do satori usa
  // memória WASM compartilhada e não é seguro chamar satori() concorrentemente
  // — gerar em paralelo corrompia o layout e "vazava" texto de uma página
  // para outra (glifos fantasmas sobrepostos no meio de linhas com wrap).
  for (const { name, build } of pages) {
    const svg = await satori(build(), { width: W, height: H, fonts });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const out = resolve(outDir, `${name}.png`);
    writeFileSync(out, png);
    const kb = (png.length / 1024).toFixed(0);
    console.log(`  ✓ ${name}.png (${kb} KB)`);
  }

  console.log(`\nDone! Files in public/og/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
