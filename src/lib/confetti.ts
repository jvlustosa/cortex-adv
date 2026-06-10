// Confete imperativo na paleta Claude (laranja + preto), um pouco mais animado.
// Burst curto com flutter lateral; some sozinho — sem estado React, sobrevive a redirect.

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

/**
 * Solta um confete a partir do centro-baixo da tela.
 * Respeita prefers-reduced-motion (não dispara nada).
 * Retorna `true` se o confete foi disparado, `false` caso contrário —
 * útil pra quem chama decidir se vale esperar a animação.
 */
export function fireSubtleConfetti(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

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

  // Burst um pouco mais cheio e espalhado, mas ainda elegante.
  const originX = w / 2;
  const originY = h * 0.62;
  const particles: ConfettiParticle[] = Array.from({ length: 60 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
    const speed = 5 + Math.random() * 7;
    return {
      x: originX + (Math.random() - 0.5) * 120,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 0.5 + Math.random() * 0.9,
      opacity: 0.92,
    };
  });

  let frame = 0;
  let raf = 0;

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    frame++;

    let alive = false;
    for (const p of particles) {
      p.vy += 0.14; // gravidade
      p.vx *= 0.985;
      // Flutter lateral: balança enquanto cai, dá vida ao confete.
      p.x += p.vx + Math.sin((frame + p.swayPhase) * 0.13) * p.swayAmp;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (frame > 40) p.opacity -= 0.016;

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
