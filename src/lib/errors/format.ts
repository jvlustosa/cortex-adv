export function formatErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim() || "Erro sem mensagem";
  }
  if (typeof error === "string") {
    return error.trim() || "Erro desconhecido";
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Erro desconhecido";
  }
}

export function formatErrorDigest(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
  ) {
    const digest = (error as { digest: string }).digest.trim();
    return digest || undefined;
  }
  return undefined;
}

export function defaultCrashTitle(): string {
  return "Algo deu errado";
}

export function defaultCrashDescription(): string {
  return "Não foi possível carregar esta página. Tente de novo ou fale com o suporte pelo WhatsApp.";
}

/** Mensagem amigável quando a API não retorna texto útil. */
export function fallbackApiMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "Você não tem permissão para esta ação. Faça login novamente.";
  }
  if (status === 429) {
    return "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";
  }
  if (status >= 500) {
    return "Falha temporária no servidor. Tente novamente em instantes.";
  }
  return "Não foi possível concluir a operação. Tente de novo.";
}

export async function readApiErrorMessage(
  res: Response,
  fallback?: string,
): Promise<string> {
  const base = fallback ?? fallbackApiMessage(res.status);

  try {
    const data = (await res.json()) as { error?: string; message?: string };
    const text = data.message?.trim() || data.error?.trim();
    return text && isLikelyPortugueseOrNeutral(text) ? text : mapEnglishApiError(text) ?? base;
  } catch {
    return base;
  }
}

function isLikelyPortugueseOrNeutral(text: string): boolean {
  if (/[áàâãéêíóôõúç]/i.test(text)) return true;
  const englishHints =
    /\b(invalid|failed|error|network|webhook|not configured|too many|unauthorized)\b/i;
  return !englishHints.test(text);
}

function mapEnglishApiError(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.toLowerCase();

  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Falha de conexão. Verifique a internet e tente novamente.";
  }
  if (m.includes("webhook") && m.includes("not configured")) {
    return "Serviço temporariamente indisponível. Tente mais tarde.";
  }
  if (m.includes("slack")) {
    return "Envio temporariamente indisponível. Tente novamente.";
  }
  if (m.includes("unauthorized") || m.includes("not authorized")) {
    return "Você não tem permissão para esta ação.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("already registered") || m.includes("already been")) {
    return "Este e-mail já está cadastrado. Use Entrar.";
  }

  return null;
}

export function mapSignupServerError(message: string): string {
  const mapped = mapEnglishApiError(message);
  if (mapped) return mapped;

  if (message.trim().length > 0 && isLikelyPortugueseOrNeutral(message)) {
    return message;
  }

  return "Não foi possível concluir o cadastro. Verifique os dados ou fale com o suporte.";
}
