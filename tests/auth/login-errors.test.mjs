import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "../../scripts/security/audit-engine.mjs";

function readSrc(rel) {
  return readFileSync(join(PROJECT_ROOT, rel), "utf8");
}

/** Espelha regras críticas de mapSignInError / safeRedirectPath para teste sem TS. */
function signInMessage(message) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados ou recupere sua senha.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }
  if (m.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  }
  return "Não foi possível entrar agora. Tente de novo ou recupere sua senha.";
}

function safeRedirectPath(input, fallback = "/area-de-membros") {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  return trimmed;
}

describe("auth — erros de login e recuperação", () => {
  it("mapeia erros comuns de sign-in", () => {
    assert.match(signInMessage("Invalid login credentials"), /incorretos/i);
    assert.match(signInMessage("Email not confirmed"), /confirme seu e-mail/i);
    assert.match(signInMessage("Too many requests"), /muitas tentativas/i);
  });

  it("safeRedirectPath bloqueia open redirect", () => {
    assert.equal(safeRedirectPath("/area-de-membros"), "/area-de-membros");
    assert.equal(safeRedirectPath("//evil.com"), "/area-de-membros");
    assert.equal(safeRedirectPath("https://evil.com"), "/area-de-membros");
    assert.equal(safeRedirectPath("/aulas/cowork/cowork-1"), "/aulas/cowork/cowork-1");
  });

  it("login usa mapSignInError, safeRedirectPath e toasts", () => {
    const login = readSrc("src/components/login-form.tsx");
    assert.ok(login.includes("mapSignInError"));
    assert.ok(login.includes("safeRedirectPath"));
    assert.ok(login.includes("/recuperar-senha"));
    // Erros de login agora são exibidos via toast (não mais inline).
    assert.ok(login.includes("useToast"));
    assert.ok(login.includes("toast.error"));
    // Falha cedo quando o Supabase não está configurado (placeholder/sem creds).
    assert.ok(login.includes("isSupabaseConfigured"));
  });

  it("toast expõe acessibilidade (role=alert + aria-live)", () => {
    const toast = readSrc("src/components/toast.tsx");
    assert.ok(toast.includes('role={toast.variant === "error" ? "alert" : "status"}'));
    assert.ok(toast.includes("aria-live"));
    assert.ok(toast.includes('aria-label="Fechar aviso"'));
  });

  it("isSupabaseConfigured rejeita placeholder e exige https", () => {
    // Espelha a lógica de src/lib/supabase/enabled.ts (teste sem TS).
    const configured = (url, key) => {
      if (!url || !key) return false;
      if (url.includes("placeholder")) return false;
      if (!/^https:\/\//.test(url)) return false;
      return true;
    };
    assert.equal(configured("https://placeholder.supabase.co", "k"), false);
    assert.equal(configured("", "k"), false);
    assert.equal(configured("https://abc.supabase.co", ""), false);
    assert.equal(configured("http://abc.supabase.co", "k"), false);
    assert.equal(configured("https://abc.supabase.co", "k"), true);
  });

  it("callback e signup usam safeRedirectPath", () => {
    assert.ok(readSrc("src/app/auth/callback/route.ts").includes("safeRedirectPath"));
    assert.ok(readSrc("src/components/signup-form.tsx").includes("safeRedirectPath"));
    assert.ok(readSrc("src/lib/auth/errors.ts").includes("mapSignInError"));
  });

  it("fluxo de recuperação de senha existe", () => {
    for (const rel of [
      "src/app/recuperar-senha/page.tsx",
      "src/app/auth/atualizar-senha/page.tsx",
      "src/components/forgot-password-form.tsx",
      "src/components/reset-password-form.tsx",
    ]) {
      assert.ok(readSrc(rel).length > 0, `${rel} ausente`);
    }

    const forgot = readSrc("src/components/forgot-password-form.tsx");
    assert.ok(forgot.includes("resetPasswordForEmail"));
    const reset = readSrc("src/components/reset-password-form.tsx");
    assert.ok(reset.includes("updateUser"));
  });
});
