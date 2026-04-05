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
    return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { score, maxScore, level, title } = body;
  const pct = Math.round((score / maxScore) * 100);

  const text = `Quiz Cortex · ${level} (${pct}%) — ${score}/${maxScore} pts\n${title}`;

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
