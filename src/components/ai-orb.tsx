"use client";

import { useRef, useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

interface AIOrbProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  active?: boolean;
}

const SIZE_CONFIG = {
  sm: { px: 24, particles: 80, glow: 2 },
  md: { px: 40, particles: 150, glow: 3 },
  lg: { px: 72, particles: 400, glow: 4 },
};

interface Particle {
  phi: number;
  theta: number;
  speed: number;
  offset: number;
  drift: number;
}

function initParticles(count: number): Particle[] {
  const particles: Particle[] = [];
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

export function AIOrb({ size = "md", className, active = true }: AIOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[] | null>(null);
  const activeRef = useRef(active);
  const timeRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const config = SIZE_CONFIG[size];
  const dpr = useSyncExternalStore(
    () => () => {},
    () => Math.min(window.devicePixelRatio || 1, 2),
    () => 1,
  );

  useEffect(() => {
    particlesRef.current = initParticles(config.particles);
    timeRef.current = 0;

    function loop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const particles = particlesRef.current;
      if (!particles) return;

      const w = config.px * dpr;
      const h = config.px * dpr;
      const cx = w / 2;
      const cy = h / 2;
      const radius = config.px * 0.38 * dpr;

      const dt = activeRef.current ? 0.025 : 0.008;
      timeRef.current += dt;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      const rotY = t * 0.6;
      const rotX = Math.sin(t * 0.15) * 0.3;

      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);
      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);

      const sorted: { x: number; y: number; z: number; idx: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const wobble = activeRef.current
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

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [config, dpr, size]);

  return (
    <canvas
      ref={canvasRef}
      width={config.px * dpr}
      height={config.px * dpr}
      className={cn("shrink-0", className)}
      style={{ width: config.px, height: config.px }}
    />
  );
}
