import { test, expect } from "@playwright/test";

test.describe("Formulário de lista de espera", () => {
  test.beforeEach(async ({ context }) => {
    // Garante estado limpo (o form auto-redireciona se já houver lead salvo).
    await context.clearCookies();
  });

  test("preenche, envia, solta confete e vai pro /obrigado", async ({ page }) => {
    // Intercepta o envio pra não depender do webhook do Slack.
    let submittedBody: Record<string, unknown> | null = null;
    await page.route("**/api/waitlist", async (route) => {
      submittedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.addInitScript(() => {
      try {
        localStorage.removeItem("cj_claude_academy_lead");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/");

    // O form fica na seção de inscrição (compact) no fim da home.
    const nome = page.getByPlaceholder("Seu nome");
    await nome.scrollIntoViewIfNeeded();
    await nome.fill("Maria Teste");
    await page.getByPlaceholder("Seu melhor e-mail").fill("maria@example.com");
    await page.getByPlaceholder("WhatsApp com DDD").fill("11987654321");

    await page.getByRole("button", { name: /entrar na fila/i }).click();

    // Confete sutil aparece antes do redirect.
    await expect(page.locator('[data-testid="confetti"]')).toBeAttached({
      timeout: 2000,
    });

    // Redireciona pro obrigado.
    await expect(page).toHaveURL(/\/obrigado/, { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: /você está na fila/i }),
    ).toBeVisible();

    // Payload enviado com os dados certos.
    expect(submittedBody).toMatchObject({
      nome: "Maria Teste",
      email: "maria@example.com",
      whatsapp: "+5511987654321",
      whatsapp_ddi: "+55",
    });
  });

  test("bloqueia envio com e-mail inválido", async ({ page }) => {
    await page.goto("/");
    const nome = page.getByPlaceholder("Seu nome");
    await nome.scrollIntoViewIfNeeded();
    await nome.fill("Joao");
    await page.getByPlaceholder("Seu melhor e-mail").fill("semarroba");
    await page.getByPlaceholder("WhatsApp com DDD").fill("11987654321");

    await page.getByRole("button", { name: /entrar na fila/i }).click();

    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page).toHaveURL("/");
  });
});
