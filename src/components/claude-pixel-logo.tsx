"use client";

import { useRef, useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
/** Bootstrap Icons bi-claude (16×16) */
const CLAUDE_PATH =
  "m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z";

/** Balança. Johnny-automatic / Open Clip Art (CC0) */
const SCALES_PATH =
  "M318.63 191.34 275.78 63.71l6.892 1.386c-.563 2.401.902 4.816 3.304 5.41 2.419.599 4.869-.877 5.47-3.298.602-2.42-.878-4.868-3.301-5.469-2.095-.518-4.205.523-5.125 2.384l-58.16-17.14-54.361-16.029-.509-9.298c5.801-.21 10.444-4.966 10.444-10.818.01-5.985-4.85-10.838-10.84-10.838-5.985 0-10.837 4.853-10.837 10.838 0 5.288 3.79 9.686 8.8 10.64l-.477 8.708-53.87-10.838L52.668 7.169c.08-2.094-1.315-4.028-3.429-4.552-2.419-.599-4.867.879-5.466 3.299-.599 2.421.877 4.869 3.297 5.468 2.418.598 4.865-.876 5.468-3.292l5.889 1.736-42.537 127.15H.01s9.255 20.324 58.069 20.324 54.804-20.324 54.804-20.324h-10.446L59.902 10.258l51.784 15.269 54.78 16.151-11.76 214.82s.461 9.693-14.772 12.002c-15.234 2.308-34.621 3.229-43.853 8.309-9.233 5.078-10.617 11.078-10.617 11.078h166.64s-1.386-6-10.615-11.078c-9.234-5.079-28.621-6.001-43.854-8.309-15.233-2.309-14.772-12.002-14.772-12.002l-11.72-213.83 52.188 10.499 51.506 10.362-42.755 127.82h-11.623s9.255 20.324 58.068 20.324 54.804-20.324 54.804-20.324h-14.7zm-219.7-54.36H19.372L59.081 18.27 98.93 136.98zm136.64 54.36 39.708-118.71 39.85 118.71h-79.56z";

const CLAUDE_BOUNDS = { w: 16, h: 16 } as const;
const SCALES_BOUNDS = { w: 333.33, h: 287.889 } as const;

/** Grade fixa — todos os ícones viram blocos quadrados na mesma resolução */
const PIXEL_BLOCKS = 36;
const BLOCK_RASTER = 8;
const LOGO_MARGIN_RATIO = 0.08;

const ORANGE_PALETTE = [
  { h: 18, s: 72, l: 52 },
  { h: 16, s: 78, l: 58 },
  { h: 20, s: 68, l: 46 },
  { h: 14, s: 82, l: 64 },
  { h: 22, s: 65, l: 42 },
] as const;

type ShapeKey = "claude" | "scales";

const MORPH_SEGMENTS: readonly [ShapeKey, ShapeKey][] = [
  ["claude", "scales"],
  ["scales", "claude"],
] as const;

interface Vec2 {
  x: number;
  y: number;
}

interface MorphPixel {
  claude: Vec2;
  scales: Vec2;
  phase: number;
  speed: number;
  paletteIdx: number;
  sparkle: number;
  stagger: number;
}

interface MorphScene {
  pixels: MorphPixel[];
  scalesCenter: Vec2;
  pixelBlocks: number;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface ClaudePixelLogoProps {
  size?: number;
  className?: string;
  cellSize?: number;
  /** Ciclo Claude ↔ balança */
  morph?: boolean;
  morphCycle?: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function snapToPixelGrid(p: Vec2, blocks: number): Vec2 {
  const bx = Math.min(blocks - 1, Math.max(0, Math.round(p.x * blocks - 0.5)));
  const by = Math.min(blocks - 1, Math.max(0, Math.round(p.y * blocks - 0.5)));
  return { x: (bx + 0.5) / blocks, y: (by + 0.5) / blocks };
}

/** Rasteriza o path numa grade N×N de quadrados (estilo pixel art) */
function sampleBlockyFromPath(
  path: string,
  blocks: number,
  bounds: { w: number; h: number },
): Vec2[] {
  const grid = blocks * BLOCK_RASTER;
  const off = document.createElement("canvas");
  off.width = grid;
  off.height = grid;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const pad = BLOCK_RASTER;
  const inner = grid - pad * 2;
  const scale = inner / Math.max(bounds.w, bounds.h);
  const drawW = bounds.w * scale;
  const drawH = bounds.h * scale;
  const offsetX = pad + (inner - drawW) / 2;
  const offsetY = pad + (inner - drawH) / 2;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff";
  const shape = new Path2D(path);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.fill(shape);
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, grid, grid);
  const points: Vec2[] = [];
  const threshold = BLOCK_RASTER * BLOCK_RASTER * 0.22;

  for (let by = 0; by < blocks; by++) {
    for (let bx = 0; bx < blocks; bx++) {
      let filled = 0;
      for (let sy = 0; sy < BLOCK_RASTER; sy++) {
        for (let sx = 0; sx < BLOCK_RASTER; sx++) {
          const px = bx * BLOCK_RASTER + sx;
          const py = by * BLOCK_RASTER + sy;
          const i = (py * grid + px) * 4;
          if (data[i + 3] >= 128) filled++;
        }
      }
      if (filled < threshold) continue;
      points.push({ x: (bx + 0.5) / blocks, y: (by + 0.5) / blocks });
    }
  }

  return points;
}

function centroid(points: Vec2[]): Vec2 {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function sortByPolar(points: Vec2[], center: Vec2): Vec2[] {
  return [...points].sort((a, b) => {
    const aa = Math.atan2(a.y - center.y, a.x - center.x);
    const ab = Math.atan2(b.y - center.y, b.x - center.x);
    if (aa !== ab) return aa - ab;
    const da = (a.x - center.x) ** 2 + (a.y - center.y) ** 2;
    const db = (b.x - center.x) ** 2 + (b.y - center.y) ** 2;
    return da - db;
  });
}

function resample(points: Vec2[], count: number): Vec2[] {
  if (points.length === 0) {
    return Array.from({ length: count }, () => ({ x: 0.5, y: 0.5 }));
  }
  if (points.length === count) return points;
  if (points.length === 1) {
    return Array.from({ length: count }, () => ({ ...points[0] }));
  }

  const result: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * points.length;
    const idx = Math.floor(t) % points.length;
    const next = (idx + 1) % points.length;
    const frac = t - Math.floor(t);
    result.push({
      x: points[idx].x + (points[next].x - points[idx].x) * frac,
      y: points[idx].y + (points[next].y - points[idx].y) * frac,
    });
  }
  return result;
}

function buildMorphScene(): MorphScene {
  const blocks = PIXEL_BLOCKS;

  const claudeRaw = sampleBlockyFromPath(CLAUDE_PATH, blocks, CLAUDE_BOUNDS);
  const scalesRaw = sampleBlockyFromPath(SCALES_PATH, blocks, SCALES_BOUNDS);

  const claudeCenter = centroid(claudeRaw);
  const scalesCenter = centroid(scalesRaw);

  const claudeSorted = sortByPolar(claudeRaw, claudeCenter);
  const scalesSorted = sortByPolar(scalesRaw, scalesCenter);

  const count = Math.max(claudeSorted.length, scalesSorted.length, 64);

  const claude = resample(claudeSorted, count);
  const scales = resample(scalesSorted, count);

  const pixels = claude.map((claudePos, i) => ({
    claude: claudePos,
    scales: scales[i],
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 1.6,
    paletteIdx: Math.floor(Math.random() * ORANGE_PALETTE.length),
    sparkle: Math.random(),
    stagger: (i / count) * 0.55 + Math.random() * 0.08,
  }));

  return { pixels, scalesCenter, pixelBlocks: blocks };
}

function getMorphSegment(cyclePhase: number): {
  from: ShapeKey;
  to: ShapeKey;
  morphT: number;
} {
  const phase = ((cyclePhase % 1) + 1) % 1;
  const segIndex = Math.min(1, Math.floor(phase * 2));
  const localT = phase * 2 - segIndex;
  const [from, to] = MORPH_SEGMENTS[segIndex];
  return { from, to, morphT: easeInOutCubic(localT) };
}

function getShapePosition(pixel: MorphPixel, shape: ShapeKey): Vec2 {
  return shape === "claude" ? pixel.claude : pixel.scales;
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotion() {
  return false;
}

export function ClaudePixelLogo({
  size = 300,
  className,
  cellSize = 5,
  morph = true,
  morphCycle = 24,
}: ClaudePixelLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const sceneRef = useRef<MorphScene | null>(null);
  const embersRef = useRef<Ember[]>([]);
  const timeRef = useRef(0);

  const dpr = useSyncExternalStore(
    () => () => {},
    () => Math.min(window.devicePixelRatio || 1, 3),
    () => 1,
  );

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  useEffect(() => {
    sceneRef.current = buildMorphScene();
    embersRef.current = [];
    timeRef.current = 0;

    function spawnEmber(w: number, h: number, activeMorph: number) {
      if (activeMorph > 0.5) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = size * 0.28 + Math.random() * size * 0.12;
      embersRef.current.push({
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        life: 0,
        maxLife: 40 + Math.random() * 50,
        size: 2 + Math.random() * 2,
      });
      if (embersRef.current.length > 18) {
        embersRef.current.shift();
      }
    }

    function loop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scene = sceneRef.current;
      if (!scene) return;

      const w = size * dpr;
      const h = size * dpr;
      timeRef.current += 0.022;
      const t = timeRef.current;

      const cyclePhase = reducedMotion || !morph ? 0 : (t / morphCycle) % 1;
      const { from, to, morphT: segmentT } = getMorphSegment(cyclePhase);
      const scalesActive = from === "scales" || to === "scales";

      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;

      const cell = cellSize * dpr;
      const margin = w * LOGO_MARGIN_RATIO;
      const drawSize = w - margin * 2;

      for (const p of scene.pixels) {
        const staggered = Math.max(
          0,
          Math.min(
            1,
            (segmentT - p.stagger * 0.35) / (1 - p.stagger * 0.35),
          ),
        );
        const morphT = easeInOutCubic(staggered);

        const fromPos = getShapePosition(p, from);
        const toPos = getShapePosition(p, to);

        const morphed = snapToPixelGrid(
          {
            x: fromPos.x + (toPos.x - fromPos.x) * morphT,
            y: fromPos.y + (toPos.y - fromPos.y) * morphT,
          },
          scene.pixelBlocks,
        );
        const x = morphed.x;
        const y = morphed.y;

        const twinkle =
          0.35 +
          0.45 * Math.sin(t * p.speed + p.phase) +
          0.2 * Math.sin(t * p.speed * 2.3 + p.phase * 1.7);

        const flash =
          p.sparkle > 0.92 && morphT < 0.55
            ? 0.25 * Math.max(0, Math.sin(t * 6 + p.phase))
            : 0;

        const alpha = Math.min(1, Math.max(0.22, twinkle + flash));
        const orange = ORANGE_PALETTE[p.paletteIdx];
        const hue = orange.h;
        const sat = orange.s;
        const light = orange.l + flash * 18;

        const px = Math.round(margin + Math.round(x * drawSize / cell) * cell);
        const py = Math.round(margin + Math.round(y * drawSize / cell) * cell);

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;

        if (alpha > 0.65 || flash > 0.12) {
          ctx.shadowBlur = (1 + morphT) * dpr * (alpha + flash) * 0.55;
          ctx.shadowColor = `hsla(${hue}, ${sat + 6}%, ${light + 8}%, ${alpha * (0.22 + morphT * 0.12)})`;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(px, py, cell, cell);
      }

      ctx.shadowBlur = 0;

      if (Math.random() < (scalesActive ? 0.14 : 0.08) * (1 - segmentT)) {
        spawnEmber(w, h, segmentT);
      }

      for (const e of embersRef.current) {
        e.life++;
        e.x += e.vx * dpr;
        e.y += e.vy * dpr;
        const progress = e.life / e.maxLife;
        const alpha =
          progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        if (alpha <= 0) continue;

        ctx.fillStyle = `hsla(18, 75%, 62%, ${alpha * 0.7})`;
        ctx.shadowBlur = 6 * dpr * alpha;
        ctx.shadowColor = `hsla(18, 80%, 70%, ${alpha * 0.4})`;
        const s = e.size * dpr;
        ctx.fillRect(e.x - s / 2, e.y - s / 2, s, s);
      }

      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cellSize, dpr, morph, morphCycle, reducedMotion, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size * dpr}
      height={size * dpr}
      className={cn("shrink-0", className)}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
      role="img"
      aria-label="Ícone pixelado alternando entre Claude e balança da justiça"
    />
  );
}
