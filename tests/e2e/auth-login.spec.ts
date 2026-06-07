import { test, expect } from "@playwright/test";

const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

let authMode: "demo" | "auth" = "demo";

test.beforeAll(async ({ request }) => {
  const res = await request.get("/login");
  const html = await res.text();
  authMode = html.includes("Em breve") && html.includes("modo demo") ? "demo" : "auth";
});

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
    await expect(page.url).toContain("next=");
  });

  test("membro autenticado acessa catálogo e aula", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo ativo");
    test.skip(!testEmail || !testPassword, "Defina TEST_USER_EMAIL e TEST_USER_PASSWORD");

    await page.goto("/login?next=/area-de-membros");
    await page.getByPlaceholder("voce@escritorio.com.br").fill(testEmail!);
    await page.getByLabel("Senha").fill(testPassword!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/area-de-membros/, { timeout: 15_000 });
    await expect(page.getByText("Cowork com Claude").first()).toBeVisible();

    await page.goto("/aulas/cowork/cowork-1");
    await expect(page).toHaveURL(/\/aulas\/cowork\/cowork-1/);
    await expect(page.getByText("Boas-vindas e mapa do curso")).toBeVisible();
  });

  test("login inválido mostra erro", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo ativo");

    await page.goto("/login");
    const emailInput = page.getByPlaceholder("voce@escritorio.com.br");
    test.skip(!(await emailInput.isVisible()), "Formulário de login indisponível");

    await emailInput.fill("invalido@example.com");
    await page.getByLabel("Senha").fill("senha-errada-xyz");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/invalid|incorret|credentials|senha|login/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
