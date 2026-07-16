import { test, expect, type Page } from "@playwright/test";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const testEmail = process.env.TEST_USER_EMAIL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let authMode: "demo" | "auth" = "demo";

test.beforeAll(async ({ request }) => {
  const res = await request.get("/login");
  const html = await res.text();
  authMode = html.includes("Em breve") && html.includes("modo demo") ? "demo" : "auth";
});

/**
 * Estabelece sessão de membro sem UI: gera um magic link pela admin API e segue
 * a rota /auth/confirm real (verifyOtp grava o cookie SSR). É o equivalente e2e
 * de clicar no link do e-mail — não há login por senha para automatizar.
 * Retorna false (em vez de quebrar) quando faltam credenciais ou o usuário não
 * existe, para o teste pular com uma mensagem honesta.
 */
async function signInViaMagicLink(page: Page, email: string): Promise<boolean> {
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    return false;
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return false;

  await page.goto(
    `/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/area-de-membros`,
  );
  return true;
}

test.describe("Login e acesso ao curso", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Área de membros" })).toBeVisible();
  });

  test("admin redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("modo demo: área de membros acessível sem login", async ({ page }) => {
    test.skip(authMode !== "demo", "Supabase ativo — teste só em modo demo");

    await page.goto("/area-de-membros");
    await expect(page.getByText("Cowork com Claude").first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("modo demo: login mostra aviso Em breve", async ({ page }) => {
    test.skip(authMode !== "demo", "Supabase ativo");

    await page.goto("/login");
    await expect(page.getByText("Em breve", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "modo demo" })).toBeVisible();
  });

  test("modo auth: curso exige login", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo ativo");

    await page.goto("/area-de-membros");
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("modo auth: formulário é magic-link, sem senha", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo ativo");

    await page.goto("/login");
    await expect(page.getByPlaceholder("voce@escritorio.com.br")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Receber link de acesso" }),
    ).toBeVisible();
    // Login é passwordless: não deve existir campo de senha.
    await expect(page.getByLabel("Senha")).toHaveCount(0);
  });

  test("modo auth: pedir link mostra estado neutro sem revelar conta", async ({
    page,
  }) => {
    test.skip(authMode !== "auth", "modo demo ativo");

    // Intercepta o OTP do Supabase: não dispara e-mail real e mantém o teste
    // determinístico. Conta inexistente cai no mesmo estado neutro do sucesso
    // (anti-enumeração), então uma resposta OK reproduz o caminho observável.
    await page.route("**/auth/v1/otp**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      }),
    );

    await page.goto("/login");
    const email = "sem-conta-e2e@example.com";
    await page.getByPlaceholder("voce@escritorio.com.br").fill(email);
    await page.getByRole("button", { name: "Receber link de acesso" }).click();

    await expect(page.getByText("Confira seu e-mail")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Usar outro e-mail" }),
    ).toBeVisible();
  });

  test("membro autenticado acessa catálogo e aula", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo ativo");
    test.skip(!testEmail, "Defina TEST_USER_EMAIL (membro real) para o fluxo autenticado");

    const signedIn = await signInViaMagicLink(page, testEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail sem conta — pulei o login real");

    await expect(page).toHaveURL(/\/area-de-membros/, { timeout: 15_000 });
    await expect(page.getByText("Cowork com Claude").first()).toBeVisible();

    await page.goto("/aulas/cowork/cowork-1");
    await expect(page).toHaveURL(/\/aulas\/cowork\/cowork-1/);
    await expect(page.getByText("Boas-vindas e mapa do curso")).toBeVisible();
  });
});
