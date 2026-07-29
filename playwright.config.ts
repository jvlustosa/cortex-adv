import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * URL do `next dev` deste repo que já está no ar (Next 16 grava em .next/dev/lock).
 * Sem isto a suíte cai no :3000 default — que na máquina de dev costuma ser o
 * servidor de outro projeto — e falha inteira testando o app errado.
 */
function runningDevServerUrl(): string | null {
  try {
    const lock = JSON.parse(
      fs.readFileSync(path.join(__dirname, ".next", "dev", "lock"), "utf8"),
    ) as { pid?: number; appUrl?: string };
    if (!lock.pid || !lock.appUrl) return null;

    // Lock órfão (servidor morreu sem limpar) não conta.
    try {
      process.kill(lock.pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EPERM") return null;
    }

    return lock.appUrl;
  } catch {
    return null;
  }
}

const devServerUrl = runningDevServerUrl();

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.AUDIT_BASE_URL ??
  devServerUrl ??
  "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Com dev server já rodando não dá pra subir outro (o Next recusa) — reusa.
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER || devServerUrl
      ? undefined
      : {
          command: "npm run dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
});
