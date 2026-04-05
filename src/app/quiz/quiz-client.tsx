"use client";

import { useState, useCallback } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { AIOrb } from "@/components/ai-orb";
import { questions, getResult, maxScore } from "./quiz-data";

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

export function QuizClient() {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const result = getResult(totalScore);
  const progress = phase === "quiz" ? ((current + 1) / questions.length) * 100 : 0;

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
  };

  // ── Intro ──
  if (phase === "intro") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <AIOrb size="lg" />
          <h1 className="mt-8 font-serif text-3xl tracking-tight text-[var(--foreground)] md:text-4xl">
            Quão atualizado você está com IA?
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            6 perguntas · menos de 2 minutos · resultado imediato
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Descubra se você está acompanhando a revolução dos agentes de IA na
            advocacia — ou ficando pra trás.
          </p>
          <button
            onClick={() => setPhase("quiz")}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
          >
            Começar o quiz
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === "result") {
    const pct = Math.round((totalScore / maxScore) * 100);

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Score ring */}
          <div className="relative mx-auto mb-8 size-36">
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
    );
  }

  // ── Quiz ──
  const q = questions[current];

  return (
    <div className="flex min-h-[100dvh] flex-col">
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
                  <span className="mr-3 inline-flex size-6 items-center justify-center rounded-md bg-[var(--surface-raised)] text-xs font-medium text-[var(--muted)] group-hover:text-[var(--accent)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
