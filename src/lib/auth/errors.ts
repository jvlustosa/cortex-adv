type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

function normalize(error: AuthErrorLike): { message: string; code: string } {
  return {
    message: (error.message ?? "").toLowerCase(),
    code: (error.code ?? "").toLowerCase(),
  };
}

export function mapSignInError(error: AuthErrorLike): string {
  const { message, code } = normalize(error);

  if (
    message.includes("invalid login credentials") ||
    code === "invalid_credentials" ||
    code === "invalid_grant"
  ) {
    return "E-mail ou senha incorretos. Confira os dados ou recupere sua senha.";
  }

  if (message.includes("email not confirmed") || code === "email_not_confirmed") {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }

  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    error.status === 429
  ) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  }

  if (
    message.includes("user banned") ||
    message.includes("disabled") ||
    message.includes("not authorized")
  ) {
    return "Esta conta está desativada. Fale com o suporte.";
  }

  if (message.includes("invalid email") || code === "validation_failed") {
    return "Informe um e-mail válido.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch")
  ) {
    return "Falha de conexão. Verifique a internet e tente novamente.";
  }

  return "Não foi possível entrar agora. Tente de novo ou recupere sua senha.";
}

export function mapPasswordResetRequestError(error: AuthErrorLike): string {
  const { message, code } = normalize(error);

  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    error.status === 429
  ) {
    return "Muitas solicitações. Aguarde alguns minutos antes de pedir outro link.";
  }

  if (message.includes("invalid email") || code === "validation_failed") {
    return "Informe um e-mail válido.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch")
  ) {
    return "Falha de conexão. Verifique a internet e tente novamente.";
  }

  return "Não foi possível enviar o link agora. Tente de novo em instantes.";
}

export function mapPasswordUpdateError(error: AuthErrorLike): string {
  const { message, code } = normalize(error);

  if (
    message.includes("same password") ||
    message.includes("should be different")
  ) {
    return "A nova senha deve ser diferente da atual.";
  }

  if (
    message.includes("password") &&
    (message.includes("weak") ||
      message.includes("short") ||
      message.includes("at least") ||
      code === "weak_password")
  ) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (message.includes("session") || message.includes("jwt") || code === "session_not_found") {
    return "Link expirado ou sessão inválida. Solicite um novo e-mail de recuperação.";
  }

  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    error.status === 429
  ) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch")
  ) {
    return "Falha de conexão. Verifique a internet e tente novamente.";
  }

  return "Não foi possível atualizar a senha. Solicite um novo link de recuperação.";
}

export function mapAuthCallbackQueryError(code: string | null | undefined): string | null {
  switch (code) {
    case "auth":
      return "Link de acesso inválido ou expirado. Entre com e-mail e senha ou solicite recuperação.";
    case "session":
      return "Sessão expirada. Entre novamente.";
    case "link":
      return "Link de recuperação inválido ou expirado. Solicite um novo e-mail.";
    default:
      return null;
  }
}

export function mapRecoveryPageError(code: string | null | undefined): string | null {
  switch (code) {
    case "link":
      return "Abra o link mais recente do e-mail de recuperação ou solicite um novo.";
    case "sent":
      return null;
    default:
      return mapAuthCallbackQueryError(code);
  }
}
