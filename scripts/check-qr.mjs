// Confere se o QR commitado (public/assets/images/qr-grupo-whatsapp.png) ainda
// codifica o link do grupo que a app usa hoje (OPEN_WHATSAPP_GROUP_URL /
// NEXT_PUBLIC_WHATSAPP_GROUP_URL). O asset é estático: trocar só a env deixaria
// o QR apontando pro grupo antigo — falha silenciosa, e quem escaneia cai num
// grupo morto.
//
// Uso: npm run qr:check (roda no prebuild)
//
// Compara a matriz de módulos, não os bytes do PNG: assim upgrade de
// sharp/libvips ou do rasterizador de SVG não gera falha falsa. Os módulos sob o
// logo central ficam de fora — a correção de erro "H" cobre aquela região.

import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  BADGE,
  ERROR_CORRECTION,
  GROUP_URL,
  MARGIN,
  OUTPUT,
} from "./generate-qr.mjs";

const relativeOutput = path.relative(process.cwd(), OUTPUT);

function fail(message) {
  console.error(`\n✗ QR do grupo desatualizado — ${message}`);
  console.error(`  arquivo: ${relativeOutput}`);
  console.error(`  link atual: ${GROUP_URL}`);
  console.error(`\n  Corrija com: npm run qr\n`);
  process.exit(1);
}

if (!fs.existsSync(OUTPUT)) fail("arquivo não existe");

const expected = QRCode.create(GROUP_URL, {
  errorCorrectionLevel: ERROR_CORRECTION,
}).modules;

const { data, info } = await sharp(OUTPUT)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

if (info.width !== info.height) {
  fail(`imagem não é quadrada (${info.width}x${info.height})`);
}

// O gerador pede `width: 1024`, mas o qrcode arredonda pra caber um número
// inteiro de módulos — a escala real sai do tamanho do arquivo.
const scale = info.width / (expected.size + MARGIN * 2);

// Raio coberto pelo logo, com um módulo de folga pra não ler pixel de borda.
const center = info.width / 2;
const badgeRadius = BADGE / 2 + scale;

let compared = 0;
let mismatched = 0;

for (let row = 0; row < expected.size; row++) {
  for (let col = 0; col < expected.size; col++) {
    const x = Math.floor((MARGIN + col + 0.5) * scale);
    const y = Math.floor((MARGIN + row + 0.5) * scale);

    if (Math.hypot(x - center, y - center) <= badgeRadius) continue;

    const isDarkInFile = data[y * info.width + x] < 128;
    const isDarkExpected = expected.data[row * expected.size + col] === 1;

    compared++;
    if (isDarkInFile !== isDarkExpected) mismatched++;
  }
}

if (mismatched > 0) {
  fail(
    `${mismatched} de ${compared} módulos divergem do link configurado`,
  );
}

console.log(
  `✓ QR do grupo confere com o link configurado (${compared} módulos)\n  → ${GROUP_URL}`,
);
