import { NextResponse } from "next/server";
import {
  buildSlackWaitlistMessage,
  parseWaitlistPayload,
  resolveSlackWebhookUrl,
  validateWaitlistPayload,
} from "@/lib/waitlist/slack";

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  if (process.env.RATE_LIMIT_ENABLED === "false") return true;

  const max = Number.parseInt(process.env.MAX_REQUESTS_PER_HOUR ?? "12", 10);
  const now = Date.now();
  const key = `claude-academy:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.expiresAt) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + 3_600_000 });
    return true;
  }

  if (record.count >= max) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (body.website && String(body.website).trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const data = parseWaitlistPayload(body);
  const validation = validateWaitlistPayload(data);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Dados inválidos", message: validation.message },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: "Muitas solicitações",
        message: "Aguarde um pouco antes de enviar de novo.",
      },
      { status: 429 },
    );
  }

  const webhookUrl = resolveSlackWebhookUrl();
  if (!webhookUrl) {
    console.error("[api/waitlist] webhook não configurado");
    return NextResponse.json(
      {
        error: "Falha no envio",
        message: "Envio temporariamente indisponível.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackWaitlistMessage(data)),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[api/waitlist] Slack failed", response.status, text.slice(0, 200));
      return NextResponse.json(
        {
          error: "Falha no envio",
          message: "Não foi possível registrar agora. Tente novamente.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/waitlist]", error);
    return NextResponse.json(
      {
        error: "Falha de conexão",
        message: "Falha ao enviar. Tente novamente.",
      },
      { status: 502 },
    );
  }
}
