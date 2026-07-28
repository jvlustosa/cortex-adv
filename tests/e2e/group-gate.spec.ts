import { test, expect, type Page } from "@playwright/test";

const GROUP_URL_PATTERN = /chat\.whatsapp\.com/;

async function clearLead(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("cj_claude_academy_lead");
    } catch {
      /* ignore */
    }
  });
}

async function setLead(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("cj_claude_academy_lead", "1");
    } catch {
      /* ignore */
    }
  });
}

/**
 * Abre o gate pelo CTA. O clique é repetido porque, entre o HTML pintar e o
 * React hidratar, o anchor ainda segue o href (é o fallback sem JS, igual ao
 * popup do site) — o gate só arma depois da hidratação.
 */
async function openGate(page: Page, name: RegExp) {
  const dialog = page.getByRole("dialog");

  await expect(async () => {
    await page.getByRole("link", { name }).first().click({ noWaitAfter: true });
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  return dialog;
}

test.describe("Gate do grupo aberto", () => {
  test.beforeEach(async ({ context }) => {
    // O WhatsApp de verdade nunca entra no teste.
    await context.route(GROUP_URL_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "ok" }),
    );
  });

  test("sem lead: botão e QR só liberam o grupo depois do formulário", async ({
    page,
  }) => {
    let submittedBody: Record<string, unknown> | null = null;
    await page.route("**/api/waitlist", async (route) => {
      submittedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await clearLead(page);
    await page.goto("/grupo");

    // QR bloqueado: sem isso o gate seria decorativo no desktop.
    const qrLock = page.getByRole("button", {
      name: /preencha para liberar o qr/i,
    });
    await expect(qrLock).toBeVisible();

    const dialog = await openGate(page, /abrir grupo aberto/i);
    await expect(
      dialog.getByRole("link", { name: /entrar no grupo do whatsapp/i }),
    ).toHaveCount(0);

    await dialog.getByPlaceholder("Seu nome").fill("Maria Teste");
    await dialog.getByPlaceholder("Seu melhor e-mail").fill("maria@example.com");
    await dialog.getByPlaceholder("WhatsApp com DDD").fill("11987654321");
    await dialog
      .getByRole("button", { name: /liberar o link do grupo/i })
      .click();

    // Link do grupo aparece só agora.
    const groupLink = dialog.getByRole("link", {
      name: /entrar no grupo do whatsapp/i,
    });
    await expect(groupLink).toBeVisible();
    await expect(groupLink).toHaveAttribute("href", GROUP_URL_PATTERN);

    // Mesmo payload da lista de espera (mesma rota, mesmo helper).
    expect(submittedBody).toMatchObject({
      nome: "Maria Teste",
      email: "maria@example.com",
      whatsapp: "+5511987654321",
      whatsapp_ddi: "+55",
      page: "/grupo",
    });

    // Fechando o modal (o "Fechar" do rodapé, não o X), o QR já está liberado.
    await dialog.getByRole("button", { name: /^fechar$/i }).last().click();
    await expect(qrLock).toHaveCount(0);
  });

  test("e-mail inválido não libera o link do grupo", async ({ page }) => {
    await clearLead(page);
    await page.goto("/grupo");

    const dialog = await openGate(page, /abrir grupo aberto/i);

    await dialog.getByPlaceholder("Seu nome").fill("Joao");
    await dialog.getByPlaceholder("Seu melhor e-mail").fill("semarroba");
    await dialog.getByPlaceholder("WhatsApp com DDD").fill("11987654321");
    await dialog
      .getByRole("button", { name: /liberar o link do grupo/i })
      .click();

    await expect(dialog.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /entrar no grupo do whatsapp/i }),
    ).toHaveCount(0);
  });

  test("quem já é lead vai direto pro WhatsApp, sem formulário", async ({
    page,
  }) => {
    await setLead(page);
    await page.goto("/grupo");

    // QR sem trava.
    await expect(
      page.getByRole("button", { name: /preencha para liberar o qr/i }),
    ).toHaveCount(0);

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: /abrir grupo aberto/i }).click(),
    ]);

    expect(popup.url()).toMatch(GROUP_URL_PATTERN);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("o gate vale também fora da /grupo", async ({ page }) => {
    await clearLead(page);
    await page.goto("/curso");

    const dialog = await openGate(page, /^grupo aberto$/i);

    await expect(
      dialog.getByRole("heading", { name: /entrar no grupo aberto/i }),
    ).toBeVisible();
  });
});
