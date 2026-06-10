// Gera o QR code do grupo aberto no WhatsApp (Claude Academy).
// Saída: public/assets/images/qr-grupo-whatsapp.png — QR limpo e quadrado,
// alta resolução, módulos quase-pretos sobre branco para leitura confiável.
//
// Uso: npm run qr
// O link deve espelhar OPEN_WHATSAPP_GROUP_URL em src/lib/site.ts.

import { fileURLToPath } from "node:url";
import path from "node:path";
import QRCode from "qrcode";

const GROUP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "images",
  "qr-grupo-whatsapp.png",
);

await QRCode.toFile(OUTPUT, GROUP_URL, {
  width: 1024,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#0a0a0f", light: "#ffffff" },
});

console.log(`QR gerado: ${OUTPUT}\n  → ${GROUP_URL}`);
