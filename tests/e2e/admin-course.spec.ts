import { test, expect, type Page } from "@playwright/test";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// e2e do painel /admin com COURSE_SOURCE=db. Requer:
//   TEST_ADMIN_EMAIL — admin ativo (admin_users.active=true)
//   SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
//   COURSE_SOURCE=db no servidor (playwright sobe npm run dev com .env.local)
//
// O teste de criar seção insere e remove um módulo de smoke (slug e2e-modulo-*).

const adminEmail = process.env.TEST_ADMIN_EMAIL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function signInAsAdmin(page: Page, email: string): Promise<boolean> {
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
    `/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/admin`,
  );
  return true;
}

test.describe("Admin — curso vindo do banco (não hard-coded)", () => {
  test("/admin sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("modo DB: painel mostra gestão de módulos", async ({ page }) => {
    test.skip(!adminEmail, "Defina TEST_ADMIN_EMAIL (admin ativo) para o fluxo admin");
    const signedIn = await signInAsAdmin(page, adminEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail não-admin — pulei o login");

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

    await expect(page.getByText("Módulos e aulas", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "Criar seção" }),
    ).toBeVisible();
  });

  test("modo DB: módulos semeados aparecem na lista", async ({ page }) => {
    test.skip(!adminEmail, "Defina TEST_ADMIN_EMAIL (admin ativo) para o fluxo admin");
    const signedIn = await signInAsAdmin(page, adminEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail não-admin — pulei o login");

    await page.goto("/admin");
    await expect(page.getByText("Módulos e aulas", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "Adicionar aula" }),
    ).toBeVisible();

    await expect(page.getByText("Comece aqui").first()).toBeVisible();
    await expect(page.getByText("Fundação prática").first()).toBeVisible();
  });

  test("modo DB: criar seção pelo modal", async ({ page }) => {
    test.skip(!adminEmail, "Defina TEST_ADMIN_EMAIL (admin ativo) para o fluxo admin");
    const signedIn = await signInAsAdmin(page, adminEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail não-admin — pulei o login");

    const moduleTitle = `E2E seção ${Date.now()}`;

    await page.goto("/admin");
    await expect(page.getByText("Módulos e aulas", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Criar seção" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Criar seção" });
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill(moduleTitle);
    await dialog.getByRole("button", { name: "Criar seção" }).click();

    await expect(page.getByText("Módulo criado.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(moduleTitle).first()).toBeVisible();

    // Cleanup: exclui o módulo criado (confirma o confirm() do browser).
    page.once("dialog", (d) => d.accept());
    const modulePanel = page.locator("article").filter({ hasText: moduleTitle });
    await modulePanel.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Módulo excluído.")).toBeVisible({ timeout: 10_000 });
  });
});
