import { test, expect, type Page } from "@playwright/test";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// e2e do painel /admin com o curso vindo do BANCO (COURSE_SOURCE=db), não do
// course.yml hard-coded. Cobre o que foi reportado como quebrado: "gerir
// módulos" (bloco Seções) e "adicionar aula". Não muta dados — o dev local
// aponta pro Supabase de prod, então aqui só verificamos leitura/render.
//
// Login: magic link via service role (mesmo padrão de auth-login.spec). Requer
// TEST_ADMIN_EMAIL = e-mail de um admin ATIVO (admin_users.active=true, domínio
// admin). Sem isso, os testes autenticados pulam com mensagem honesta.

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

  test("modo DB: painel mostra gestão de Seções (gerir módulos)", async ({
    page,
  }) => {
    test.skip(!adminEmail, "Defina TEST_ADMIN_EMAIL (admin ativo) para o fluxo admin");
    const signedIn = await signInAsAdmin(page, adminEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail não-admin — pulei o login");

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

    // Bloco "Módulos e aulas" + botão "Criar seção" só existem em COURSE_SOURCE=db.
    await expect(page.getByText("Módulos e aulas", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "Criar seção" }),
    ).toBeVisible();
  });

  test("modo DB: aulas e módulos carregam do banco", async ({ page }) => {
    test.skip(!adminEmail, "Defina TEST_ADMIN_EMAIL (admin ativo) para o fluxo admin");
    const signedIn = await signInAsAdmin(page, adminEmail!);
    test.skip(!signedIn, "Service role ausente ou e-mail não-admin — pulei o login");

    await page.goto("/admin");
    await expect(page.getByText("Aulas do curso")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "Adicionar aula" }),
    ).toBeVisible();

    // Os módulos semeados no banco aparecem como cabeçalho de grupo na tabela.
    await expect(page.getByText("Comece aqui").first()).toBeVisible();
    await expect(page.getByText("Fundação prática").first()).toBeVisible();
  });
});
