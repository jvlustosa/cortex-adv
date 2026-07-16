// Confete imperativo na paleta Claude (laranja + preto). Sem estado React,
// sobrevive a redirect. Dois presets:
//   - fireSubtleConfetti     → burst curto do centro-baixo (lista de espera)
//   - fireCelebrationConfetti → canhões laterais + jato central (parabéns pós-cadastro)
// Ambos respeitam prefers-reduced-motion (não disparam nada).

const CONFETTI_COLORS = [
  "#d97757",
  "#e8886a",
  "#c96840",
  "#c2410c",
  "#f4a382",
  "#18181b",
  "#000000",
];

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swayAmp: number;
  opacity: number;
};

type LaunchOptions = {
  /** Aceleração vertical por frame. */
  gravity: number;
  /** Atrito horizontal por frame (0–1). */
  drag: number;
  /** A partir de qual frame as peças começam a sumir. */
  fadeStartFrame: number;
  /** Quanto de opacidade some por frame depois do fade. */
  fadeRate: number;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function pickColor(): string {
  return CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
}

/** Uma peça, lançada de (x,y) na direção `angle` com `speed`. */
function makeParticle(
  x: number,
  y: number,
  angle: number,
  speed: number,
  sizeBase: number,
  sizeVar: number,
): ConfettiParticle {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: sizeBase + Math.random() * sizeVar,
    color: pickColor(),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.4,
    swayPhase: Math.random() * Math.PI * 2,
    swayAmp: 0.5 + Math.random() * 0.9,
    opacity: 0.92,
  };
}

/**
 * Cria o canvas, roda o loop até todas as peças sumirem e se limpa sozinho.
 * `makeParticles` recebe a largura/altura da viewport pra posicionar os jatos.
 * Retorna `true` se disparou, `false` caso contrário (SSR / reduced-motion /
 * sem canvas) — útil pra quem chama decidir se vale esperar a animação.
 */
function launch(
  makeParticles: (w: number, h: number) => ConfettiParticle[],
  opts: LaunchOptions,
): boolean {
  if (prefersReducedMotion()) return false;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-testid", "confetti");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:60;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return false;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);

  const particles = makeParticles(w, h);
  let frame = 0;
  let raf = 0;

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    frame++;

    let alive = false;
    for (const p of particles) {
      p.vy += opts.gravity;
      p.vx *= opts.drag;
      // Flutter lateral: balança enquanto cai, dá vida ao confete.
      p.x += p.vx + Math.sin((frame + p.swayPhase) * 0.13) * p.swayAmp;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (frame > opts.fadeStartFrame) p.opacity -= opts.fadeRate;

      if (p.opacity <= 0 || p.y > h + 20) continue;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      // Borda sutil pra peças escuras aparecerem no fundo quase-preto.
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    if (alive) {
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }

  raf = requestAnimationFrame(loop);
  return true;
}

/**
 * Burst curto e elegante a partir do centro-baixo da tela.
 * Usado na confirmação da lista de espera.
 */
export function fireSubtleConfetti(): boolean {
  return launch(
    (w, h) => {
      const originX = w / 2;
      const originY = h * 0.62;
      return Array.from({ length: 60 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
        const speed = 5 + Math.random() * 7;
        return makeParticle(
          originX + (Math.random() - 0.5) * 120,
          originY,
          angle,
          speed,
          4,
          5,
        );
      });
    },
    { gravity: 0.14, drag: 0.985, fadeStartFrame: 40, fadeRate: 0.016 },
  );
}

/**
 * Celebração cheia: dois canhões laterais mirando pra cima + um jato central
 * largo (~160 peças), com mais tempo no ar. Usado na tela de parabéns do
 * cadastro. Mesma paleta laranja + preto.
 */
export function fireCelebrationConfetti(): boolean {
  return launch(
    (w, h) => {
      const particles: ConfettiParticle[] = [];

      // Canhão esquerdo — mira pra cima-direita.
      for (let i = 0; i < 55; i++) {
        const angle = -Math.PI / 3 + (Math.random() - 0.5) * 0.5;
        particles.push(
          makeParticle(w * 0.06, h * 0.9, angle, 11 + Math.random() * 8, 4, 6),
        );
      }

      // Canhão direito — mira pra cima-esquerda.
      for (let i = 0; i < 55; i++) {
        const angle = (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.5;
        particles.push(
          makeParticle(w * 0.94, h * 0.9, angle, 11 + Math.random() * 8, 4, 6),
        );
      }

      // Jato central largo, do meio-baixo.
      for (let i = 0; i < 50; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
        particles.push(
          makeParticle(
            w / 2 + (Math.random() - 0.5) * 140,
            h * 0.7,
            angle,
            7 + Math.random() * 8,
            4,
            6,
          ),
        );
      }

      return particles;
    },
    { gravity: 0.13, drag: 0.99, fadeStartFrame: 70, fadeRate: 0.012 },
  );
}
