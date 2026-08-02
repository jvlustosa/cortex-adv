import { test, expect } from "@playwright/test";

/**
 * Player da aula e a saída quando o vídeo não abre.
 *
 * Iframe cross-origin falha calado: o `error` nunca dispara e o `load` chega
 * até quando o Tella devolve "bloqueado" ou "not found". Sem sinal confiável,
 * o que segura o aluno é a barra de ações estar sempre visível — inclusive
 * quando o embed está morto. É isso que estes testes travam.
 */

const LESSON = "/aulas/comece-aqui/o-que-e-claude";

let demoMode = false;

test.beforeAll(async ({ request }) => {
  const html = await (await request.get("/login")).text();
  demoMode = html.includes("Em breve") && html.includes("modo demo");
});

test.describe("Player da aula", () => {
  test.beforeEach(() => {
    test.skip(!demoMode, "Supabase ativo — a aula exige login");
  });

  test("player embeda o vídeo e mantém as saídas à mão", async ({ page }) => {
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    const player = page.locator('iframe[title="O que é o Claude"]');
    await expect(player).toHaveAttribute("src", /tella\.tv\/video\/.+\/embed/);

    // fullscreen precisa estar no `allow`: com o atributo presente ele tem
    // precedência e o allowFullScreen sozinho é ignorado pelo Chrome.
    await expect(player).toHaveAttribute("allow", /fullscreen/);

    await expect(page.getByText("Vídeo travou ou não abriu?")).toBeVisible();
    await expect(page.getByRole("button", { name: /Recarregar player/ })).toBeVisible();

    const open = page.getByRole("link", { name: /Abrir no Tella/ });
    await expect(open).toHaveAttribute("href", /^https:\/\/www\.tella\.tv\/video\//);
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(open).toHaveAttribute("rel", /noopener/);
  });

  test("recarregar remonta o iframe sem sair da página", async ({ page }) => {
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    const player = page.locator('iframe[title="O que é o Claude"]');
    const before = await player.elementHandle();

    await page.getByRole("button", { name: /Recarregar player/ }).click();

    await expect(player).toBeVisible();
    expect(page.url()).toContain("/aulas/comece-aqui/o-que-e-claude");
    // Elemento novo = iframe remontado, não só um src reatribuído.
    expect(await before?.evaluate((el) => el.isConnected)).toBe(false);
  });

  test("com o Tella bloqueado, o aluno ainda tem para onde ir", async ({ page }) => {
    await page.route("**://*.tella.tv/**", (r) => r.abort("blockedbyclient"));
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    // O embed morre em silêncio; a barra de saída não depende dele.
    await expect(page.getByText("Vídeo travou ou não abriu?")).toBeVisible();
    await expect(page.getByRole("button", { name: /Recarregar player/ })).toBeEnabled();
    await expect(page.getByRole("link", { name: /Abrir no Tella/ })).toBeVisible();
  });

  test("aula sem vídeo mostra o aviso, não um quadro preto", async ({ page }) => {
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });
    const hasVideo = await page.locator("iframe").count();
    test.skip(hasVideo > 0, "todas as aulas do catálogo têm vídeo");

    await expect(page.getByText(/Vídeo desta aula em produção/)).toBeVisible();
  });
});
