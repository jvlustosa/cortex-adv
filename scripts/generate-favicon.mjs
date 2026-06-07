/**
 * Generates favicon PNGs/ICO from the Claude Academy logo.
 * Run: node scripts/generate-favicon.mjs
 * Requires: magick (ImageMagick) on PATH.
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "public/assets/claude-academy-logo.svg");

const outputs = [
  { name: "favicon-16x16.png", size: 16, dir: "public" },
  { name: "favicon-32x32.png", size: 32, dir: "public" },
  { name: "apple-icon.png", size: 180, dir: "public" },
  { name: "icon-192.png", size: 192, dir: "public" },
  { name: "icon-512.png", size: 512, dir: "public" },
  { name: "icon.png", size: 32, dir: "src/app" },
];

for (const { name, size, dir } of outputs) {
  const out = resolve(root, dir, name);
  execSync(
    `magick "${src}" -resize ${size}x${size} -gravity center -background none -extent ${size}x${size} "${out}"`,
    { stdio: "inherit" },
  );
  console.log(`✓ ${dir}/${name}`);
}

const ico16 = resolve(root, "public/favicon-16x16.png");
const ico32 = resolve(root, "public/favicon-32x32.png");
const icoOut = resolve(root, "src/app/favicon.ico");
execSync(`magick "${ico16}" "${ico32}" "${icoOut}"`, { stdio: "inherit" });
console.log("✓ src/app/favicon.ico");
