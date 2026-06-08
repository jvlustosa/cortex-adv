import { NextResponse } from "next/server";

type Body = {
  score: number;
  maxScore: number;
  level: string;
  title: string;
};

export async function POST(request: Request) {
  const webhook = process.env.SLACK_QUIZ_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      { ok: false, error: "Serviço temporariamente indisponível." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const maxScore = Number(body.maxScore);
  const score = Number(body.score);

  if (!Number.isFinite(maxScore) || maxScore <= 0 || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: "Pontuação inválida." }, { status: 400 });
  }

  // Clamp para impedir percentuais absurdos e cap em campos de texto livres que
  // são postados direto no Slack (evita spam/injeção de mensagem).
  const safeScore = Math.min(score, maxScore);
  const pct = Math.round((safeScore / maxScore) * 100);
  const level = String(body.level ?? "").slice(0, 60).replace(/\n/g, " ");
  const title = String(body.title ?? "").slice(0, 200).replace(/\n/g, " ");

  const text = `Quiz Claude Academy · ${level} (${pct}%) · ${safeScore}/${maxScore} pts\n${title}`;

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "Não foi possível registrar o resultado do quiz." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
