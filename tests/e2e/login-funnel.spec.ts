import { test, expect } from "@playwright/test";

const GROUP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

test.describe("Funil do login", () => {
  test("CTAs 'Seja membro VIP' e comunidade gratuita resolvem sem beco sem saída", async ({
    page,
  }) => {
    await page.goto("/login");

    const vip = page.getByRole("link", { name: "Seja membro VIP" });
    const comunidade = page.getByRole("link", {
      name: /entre na comunidade gratuita/i,
    });

    // Os dois caminhos existem e o de suporte NÃO aparece mais.
    await expect(vip).toBeVisible();
    await expect(comunidade).toBeVisible();
    await expect(comunidade).toHaveAttribute("href", GROUP_URL);
    await expect(page.getByText(/suporte no whatsapp/i)).toHaveCount(0);

    // VIP leva pra seção de preços na home (âncora canônica).
    await expect(vip).toHaveAttribute("href", "/#precos");
    await vip.click();
    await expect(page).toHaveURL(/\/#precos$/);
    await expect(page.locator("#precos")).toBeVisible();

    // E o destino final do funil VIP (lista de espera) existe na mesma página.
    await expect(page.locator("#lista-espera")).toBeAttached();
  });
});
