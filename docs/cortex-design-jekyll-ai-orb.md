# Cortex: design + AI Orb em site Jekyll (HTML)

Guia para replicar a identidade visual e o **AI Orb** (esfera de partículas em canvas) fora do Next.js — por exemplo em **Jekyll** com HTML estático.

Fonte de referência no repositório: `src/app/globals.css`, `src/components/ai-orb.tsx`, `scripts/generate-favicon.mjs` (orb estático em SVG).

---

## 1. Paleta e tokens (dark, padrão do Cortex)

Copie no CSS global do Jekyll (`assets/css/main.scss` ou `assets/css/style.css`):

```css
:root {
  --background: #191918;
  --foreground: #e8e4dc;
  --muted: #8c8a85;
  --accent: #d4a574;
  --accent-hover: #e0b88a;
  --surface: #232322;
  --border: #2e2d2b;
  --ring: rgba(212, 165, 116, 0.2);
  --surface-raised: #2a2a28;
  --danger: #e5736a;
  --success: #7ec699;
}

@media (prefers-color-scheme: light) {
  :root {
    --background: #faf9f6;
    --foreground: #1a1a19;
    --muted: #6b6a66;
    --accent: #b8845a;
    --accent-hover: #a07248;
    --surface: #ffffff;
    --border: #e8e5df;
    --surface-raised: #f5f4f0;
    --danger: #c4453b;
    --success: #3d8c5c;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  line-height: 1.65;
}

::selection {
  background: var(--accent);
  color: var(--background);
}
```

O orb em si usa **HSL** calculado no canvas (tons âmbar/dourado, `hue` ~28–36); não depende dessas variáveis em runtime, mas o restante da página deve usar `--accent`, `--foreground`, etc., para ficar coerente.

---

## 2. Tipografia

No projeto original:

- **Sans:** DM Sans (`--font-dm-sans`)
- **Serif (títulos):** Instrument Serif (`--font-instrument-serif`)

No Jekyll, no `<head>` ou no layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

```css
body {
  font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}
h1, h2, h3, .font-serif {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
}
```

---

## 3. O que é o AI Orb

- Esfera de **pontos** distribuídos em uma esfera (aproximação fibonacci / golden spiral).
- Cada frame: rotação em Y, leve oscilação em X, **wobble** no raio, ordenação por profundidade (Z), desenho de círculos com opacidade e tamanho conforme profundidade.
- Cores: `hsla(hue, sat%, light%, alpha)` com `hue` ~28 + profundidade.
- Tamanhos no original: **sm** 24px / **md** 40px / **lg** 72px (largura/altura do canvas CSS).

Modo **active** (padrão): animação mais rápida e wobble maior. **inactive**: mais lento (útil para poupar CPU em páginas secundárias).

---

## 4. Estrutura sugerida no Jekyll

```
_includes/
  ai-orb.html
assets/
  js/
    ai-orb.js
```

### `_includes/ai-orb.html`

Parâmetros via variáveis Liquid (ajuste nomes conforme seu padrão):

```liquid
{% comment %}
  Uso: {% include ai-orb.html size="md" class="minha-classe" active="true" %}
  size: sm | md | lg
{% endcomment %}
{% assign orb_size = include.size | default: "md" %}
{% assign orb_class = include.class | default: "" %}
{% assign orb_active = include.active | default: "true" %}
<canvas
  class="ai-orb {{ orb_class }}"
  data-ai-orb-size="{{ orb_size }}"
  data-ai-orb-active="{{ orb_active }}"
  aria-hidden="true"
></canvas>
<script src="{{ '/assets/js/ai-orb.js' | relative_url }}" defer></script>
```

Incluir **uma vez** o script no layout (footer) se preferir não repetir o `<script>` em cada include:

```liquid
<script src="{{ '/assets/js/ai-orb.js' | relative_url }}" defer></script>
```

E no include deixar só o `<canvas ...>`.

### `assets/js/ai-orb.js`

Cole o script abaixo. Ele procura todos os `canvas[data-ai-orb-size]` e inicializa cada um.

```javascript
(function () {
  const SIZE_CONFIG = {
    sm: { px: 24, particles: 80, glow: 2 },
    md: { px: 40, particles: 150, glow: 3 },
    lg: { px: 72, particles: 400, glow: 4 },
  };

  function initParticles(count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        phi,
        theta,
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.02,
      });
    }
    return particles;
  }

  function mount(canvas) {
    const sizeKey = canvas.dataset.aiOrbSize || "md";
    const active = canvas.dataset.aiOrbActive !== "false";
    const config = SIZE_CONFIG[sizeKey] || SIZE_CONFIG.md;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = initParticles(config.particles);
    let time = 0;
    let raf = 0;
    const size = sizeKey;

    function loop() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = config.px * dpr;
      const h = config.px * dpr;
      const cx = w / 2;
      const cy = h / 2;
      const radius = config.px * 0.38 * dpr;

      const dt = active ? 0.025 : 0.008;
      time += dt;
      const t = time;

      ctx.clearRect(0, 0, w, h);

      const rotY = t * 0.6;
      const rotX = Math.sin(t * 0.15) * 0.3;
      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);
      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);

      const sorted = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const wobble = active
          ? Math.sin(t * 2 * p.speed + p.offset) * 0.08
          : Math.sin(t * 0.5 * p.speed + p.offset) * 0.03;

        const r = radius * (1 + wobble);
        const phi = p.phi + p.drift * t;
        const theta = p.theta;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);

        const x1 = x * cosRY - z * sinRY;
        const z1 = x * sinRY + z * cosRY;
        const y1 = y * cosRX - z1 * sinRX;
        const z2 = y * sinRX + z1 * cosRX;

        sorted.push({ x: x1, y: y1, z: z2, idx: i });
      }

      sorted.sort((a, b) => a.z - b.z);

      for (const pt of sorted) {
        const depth = (pt.z / radius + 1) / 2;
        const alpha = 0.15 + depth * 0.85;
        const dotSize = (0.4 + depth * 0.8) * dpr * (size === "lg" ? 1.2 : 1);

        const hue = 28 + depth * 8;
        const sat = 45 + depth * 25;
        const light = 40 + depth * 28;

        ctx.beginPath();
        ctx.arc(cx + pt.x, cy + pt.y, Math.max(dotSize, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;

        if (depth > 0.5) {
          ctx.shadowBlur = config.glow * dpr * depth;
          ctx.shadowColor = `hsla(${hue}, 60%, 60%, ${alpha * 0.6})`;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      }

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(loop);
    }

    canvas.width = config.px * dpr;
    canvas.height = config.px * dpr;
    canvas.style.width = config.px + "px";
    canvas.style.height = config.px + "px";
    canvas.style.display = "block";

    raf = requestAnimationFrame(loop);

    return function destroy() {
      cancelAnimationFrame(raf);
    };
  }

  function boot() {
    document.querySelectorAll("canvas[data-ai-orb-size]").forEach(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
```

**Nota:** o snippet usa `data-ai-orb-size` (com hífens no HTML → `dataset.aiOrbSize` no JS). No include Liquid use `data-ai-orb-size="{{ orb_size }}"`.

### CSS mínimo para o canvas

```css
canvas.ai-orb {
  flex-shrink: 0;
  vertical-align: middle;
}
```

---

## 5. Alternativa estática (sem JS)

Para favicon, OG ou hero sem animação, o repositório gera SVG com a mesma lógica em `scripts/generate-favicon.mjs` (frame congelado + círculos + `feGaussianBlur`). Você pode:

1. Rodar o script no cortex-adv e copiar `public/icon-512.svg` / PNGs gerados; ou  
2. Reimplementar só o `renderOrbSvg` em Node e versionar o SVG no Jekyll em `assets/img/orb.svg` e usar `<img src="..." alt="">`.

---

## 6. Checklist rápido

| Item | Ação |
|------|------|
| Cores | Colar `:root` da seção 1 |
| Fontes | Google Fonts + `font-family` no `body` / títulos |
| Orb animado | `ai-orb.js` + `<canvas data-ai-orb-size="md">` |
| Performance | Use `sm` no header; `lg` só onde precisar de impacto visual |
| Acessibilidade | `aria-hidden="true"` no canvas decorativo; conteúdo real em texto |

---

## 7. Paridade com o React original

- Lógica de partículas e desenho: alinhada a `src/components/ai-orb.tsx`.
- Cores HSL e `SIZE_CONFIG`: mesmos valores.
- Diferença: o componente React reinicializa o efeito se `size`/`dpr` mudar; no Jekyll, recarregue a página se trocar tamanho em tempo real.

Se quiser **100%** o mesmo bundle, outra opção é publicar o orb como pequeno **web component** ou iframe; para Jekyll estático, o script acima costuma ser suficiente.
