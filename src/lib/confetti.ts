// Confete imperativo, bem sutil, na paleta laranja do Claude.
// Dispara um burst curto e some sozinho — sem estado React, sobrevive a redirect.

const CLAUDE_ORANGES = ["#d97757", "#e8886a", "#c96840", "#c2410c"];

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

/**
 * Solta um confete discreto a partir do centro-baixo da tela.
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

  // Poucas partículas, leves — "bem sutil".
  const originX = w / 2;
  const originY = h * 0.62;
  const particles: ConfettiParticle[] = Array.from({ length: 26 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
    const speed = 4 + Math.random() * 5;
    return {
      x: originX + (Math.random() - 0.5) * 60,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 4,
      color: CLAUDE_ORANGES[Math.floor(Math.random() * CLAUDE_ORANGES.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 0.85,
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
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16; // gravidade
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      if (frame > 24) p.opacity -= 0.02;

      if (p.opacity <= 0 || p.y > h + 20) continue;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
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
