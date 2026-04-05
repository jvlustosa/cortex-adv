"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { AIOrb } from "@/components/ai-orb";
import { questions, getResult, maxScore } from "./quiz-data";

function QuizHeader() {
  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <AIOrb size="sm" />
          <div className="flex flex-col text-left leading-tight">
            <span className="font-serif text-lg tracking-tight text-[var(--foreground)]">
              Cortex
            </span>
            <span className="text-xs text-[var(--muted)]">cortex.adv.br · Quiz</span>
          </div>
        </Link>
      </div>
    </header>
  );
}

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

// ── Confetti ──

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const colors = [
      "#d4a574",
      "#e0b88a",
      "#c8956c",
      "#8c8a85",
      "#e8e4dc",
      "#b8845a",
    ];

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    let frame = 0;
    let raf: number;

    function loop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      frame++;

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;

        if (frame > 60) {
          p.opacity -= 0.008;
        }

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
      }
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
    />
  );
}

// ── Quiz ──

export function QuizClient() {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [showConfetti, setShowConfetti] = useState(false);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const result = getResult(totalScore);
  const progress =
    phase === "quiz" ? ((current + 1) / questions.length) * 100 : 0;

  const beginQuiz = useCallback(() => {
    setCurrent(0);
    setScores([]);
    setSelected(null);
    setPhase("quiz");
  }, []);

  const handleSelect = useCallback(
    (points: number, idx: number) => {
      if (selected !== null) return;
      setSelected(idx);

      setTimeout(() => {
        const next = [...scores, points];
        setScores(next);
        setSelected(null);

        if (current + 1 >= questions.length) {
          setPhase("result");
          setShowConfetti(true);

          const total = next.reduce((a, b) => a + b, 0);
          const r = getResult(total);
          fetch("/api/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: total,
              maxScore,
              level: r.level,
              title: r.title,
            }),
          }).catch(() => {});
        } else {
          setCurrent((c) => c + 1);
        }
      }, 400);
    },
    [current, scores, selected]
  );

  const reset = () => {
    setCurrent(0);
    setScores([]);
    setSelected(null);
    setPhase("intro");
    setShowConfetti(false);
  };

  // ── Keyboard shortcuts (Typeform-style) ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      if (phase === "intro" && key === "enter") {
        e.preventDefault();
        beginQuiz();
        return;
      }

      if (phase === "quiz" && selected === null) {
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        const idx = map[key];
        const q = questions[current];
        if (idx !== undefined && q && idx < q.options.length) {
          e.preventDefault();
          handleSelect(q.options[idx].points, idx);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, selected, current, handleSelect, beginQuiz]);

  // ── Intro ──
  if (phase === "intro") {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <QuizHeader />
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg text-center">
            <div className="flex justify-center">
              <AIOrb size="lg" />
            </div>
            <h1 className="mt-8 font-serif text-3xl tracking-tight text-[var(--foreground)] md:text-4xl">
              Quão atualizado você está com IA?
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              {questions.length} perguntas · menos de 2 minutos · resultado
              imediato
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Começa com situações do dia a dia e vai subindo para conceitos e
              tendências. Foco na prática (ferramentas, agentes, automação).
            </p>
            <button
              onClick={beginQuiz}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
            >
              Começar o quiz
              <ArrowRight className="size-4" aria-hidden />
            </button>
            <p className="mt-3 hidden text-xs text-[var(--muted)]/60 md:block">
              ou pressione{" "}
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]">
                Enter ↵
              </kbd>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === "result") {
    const pct = Math.round((totalScore / maxScore) * 100);

    return (
      <div className="flex min-h-[100dvh] flex-col">
        <QuizHeader />
        {showConfetti && <Confetti />}

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg text-center">
            {/* Orb behind score (centered behind the ring) */}
            <div className="relative mx-auto mb-6 flex h-44 w-full max-w-[11rem] items-center justify-center">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="opacity-30">
                  <AIOrb size="lg" active />
                </div>
              </div>
              <div className="relative z-10 size-36">
                <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${pct * 3.267} 326.7`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[var(--foreground)]">
                    {pct}%
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {totalScore}/{maxScore} pts
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              {result.emoji} {result.level}
            </p>
            <h2 className="mt-3 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              {result.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              {result.description}
            </p>

            <div className="mt-10 flex flex-col items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
              >
                <WhatsAppIcon className="size-5" />
                Entrar no grupo do WhatsApp
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </a>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                <RotateCcw className="size-4" aria-hidden />
                Refazer o quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  const q = questions[current];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <QuizHeader />
      {/* Progress bar */}
      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {/* Counter */}
          <p className="mb-2 text-sm font-medium text-[var(--accent)]">
            {current + 1} de {questions.length}
          </p>

          {/* Question */}
          <h2
            key={q.id}
            className="font-serif text-2xl leading-snug tracking-tight text-[var(--foreground)] md:text-3xl"
          >
            {q.question}
          </h2>
          {q.subtitle && (
            <p className="mt-2 text-sm text-[var(--muted)]">{q.subtitle}</p>
          )}

          {/* Options */}
          <div className="mt-8 flex flex-col gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const letter = String.fromCharCode(65 + i);
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(opt.points, i)}
                  disabled={selected !== null}
                  className={`group relative w-full rounded-xl border px-5 py-4 text-left text-sm transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-raised)]"
                  } ${selected !== null && !isSelected ? "opacity-50" : ""}`}
                >
                  <span
                    className={`mr-3 inline-flex size-6 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--background)]"
                        : "bg-[var(--surface-raised)] text-[var(--muted)] group-hover:text-[var(--accent)]"
                    }`}
                  >
                    {letter}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 hidden text-xs text-[var(--muted)]/60 md:block">
            pressione{" "}
            {q.options
              .map((_, i) => String.fromCharCode(65 + i))
              .join(", ")}{" "}
            para selecionar
          </p>
        </div>
      </div>
    </div>
  );
}
