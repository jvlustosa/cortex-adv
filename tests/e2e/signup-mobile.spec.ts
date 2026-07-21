import { test, expect, type Page } from "@playwright/test";

// Path de criação de conta no mobile (prioridade da revisão): garante que os
// estados do /signup renderizam e que nenhuma página do funil de entrada
// estoura horizontalmente num viewport estreito (Android 360px).
test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

let authMode: "demo" | "auth" = "demo";

test.beforeAll(async ({ request }) => {
  const res = await request.get("/login");
  const html = await res.text();
  authMode = html.includes("Em breve") && html.includes("modo demo") ? "demo" : "auth";
});

/** O body nunca deve rolar na horizontal — o sintoma nº 1 de quebra no mobile. */
async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(scrollW, `overflow-x em ${page.url()}`).toBeLessThanOrEqual(clientW + 1);
}

test.describe("Criação de conta (mobile)", () => {
  test("sem convite: /signup pede o convite e oferece login", async ({ page }) => {
    test.skip(authMode !== "auth", "modo demo: /signup mostra aviso Em breve");

    await page.goto("/signup");
    await expect(page.getByText("Você precisa de um convite")).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("com convite: /signup mostra o formulário de ativação sem senha", async ({
    page,
  }) => {
    test.skip(authMode !== "auth", "modo demo: /signup mostra aviso Em breve");

    // Token inexistente: a página renderiza o formulário (lookup só lê, não
    // consome nada) — validamos o layout do fluxo, sem tocar em dados reais.
    await page.goto("/signup?token=e2e-render-check");
    await expect(page.getByPlaceholder("voce@escritorio.com.br")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ativar meu acesso" }),
    ).toBeVisible();
    // Fluxo é passwordless: não deve existir campo de senha.
    await expect(page.getByLabel("Senha")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("funil de entrada não estoura na horizontal no mobile", async ({ page }) => {
    for (const path of [
      "/signup?token=e2e-render-check",
      "/login",
      "/recuperar-senha",
    ]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    }
  });
});
