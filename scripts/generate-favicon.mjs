/**
 * Generates a static SVG of the AIOrb, then converts to favicon PNGs/ICO.
 * Run: node scripts/generate-favicon.mjs
 * Requires: rsvg-convert + magick (ImageMagick) on PATH.
 */

import { writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------- Orb particle generation (mirrors ai-orb.tsx) ----------

function initParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    particles.push({
      phi,
      theta,
      speed: 0.3 + pseudoRandom(i) * 0.7,
      offset: pseudoRandom(i + 1000) * Math.PI * 2,
      drift: (pseudoRandom(i + 2000) - 0.5) * 0.02,
    });
  }
  return particles;
}

// Deterministic "random" so favicons are reproducible
function pseudoRandom(seed) {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function renderOrbSvg(size, particleCount) {
  const particles = initParticles(particleCount);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const t = 1.2; // frozen time

  const rotY = t * 0.6;
  const rotX = Math.sin(t * 0.15) * 0.3;
  const cosRY = Math.cos(rotY);
  const sinRY = Math.sin(rotY);
  const cosRX = Math.cos(rotX);
  const sinRX = Math.sin(rotX);

  const dots = [];

  for (const p of particles) {
    const wobble = Math.sin(t * 0.5 * p.speed + p.offset) * 0.03;
    const r = radius * (1 + wobble);
    const phi = p.phi + p.drift * t;
    const theta = p.theta;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    const x1 = x * cosRY - z * sinRY;
    const z1 = x * sinRY + z * cosRY;
    const y1 = y * cosRX - z1 * sinRX;
    const z2 = y * sinRX + z1 * cosRX;

    const depth = (z2 / radius + 1) / 2;
    dots.push({ x: cx + x1, y: cy + y1, depth });
  }

  // Sort back-to-front
  dots.sort((a, b) => a.depth - b.depth);

  let circles = "";
  for (const d of dots) {
    const alpha = 0.15 + d.depth * 0.85;
    const dotSize = 0.4 + d.depth * 0.8;
    const scale = size / 72; // base size is 72
    const hue = 28 + d.depth * 8;
    const sat = 45 + d.depth * 25;
    const light = 40 + d.depth * 28;

    circles += `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${(Math.max(dotSize, 0.5) * scale * 1.2).toFixed(2)}" fill="hsla(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%, ${alpha.toFixed(3)})"`;

    if (d.depth > 0.5) {
      circles += ` filter="url(#glow)"`;
    }
    circles += `/>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(size * 0.015).toFixed(1)}"/>
    </filter>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#232322"/>
      <stop offset="100%" stop-color="#191918"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${(size * 0.18).toFixed(0)}" fill="url(#bg)"/>
  ${circles}
</svg>`;
}

// ---------- Generate files ----------

const svgLarge = renderOrbSvg(512, 400);
const svgSmall = renderOrbSvg(64, 120);

const svgLargePath = resolve(root, "public/icon-512.svg");
const svgSmallPath = resolve(root, "public/icon-64.svg");

writeFileSync(svgLargePath, svgLarge);
writeFileSync(svgSmallPath, svgSmall);

// SVG favicon (vector, for modern browsers)
const svgFavicon = renderOrbSvg(32, 80);
writeFileSync(resolve(root, "src/app/icon.svg"), svgFavicon);

console.log("✓ SVGs generated");

// PNG conversions
const sizes = [
  { name: "favicon-16x16.png", size: 16, src: svgSmallPath },
  { name: "favicon-32x32.png", size: 32, src: svgSmallPath },
  { name: "icon-192.png", size: 192, src: svgLargePath },
  { name: "icon-512.png", size: 512, src: svgLargePath },
  { name: "apple-icon.png", size: 180, src: svgLargePath },
];

for (const { name, size, src } of sizes) {
  const out = resolve(root, "public", name);
  execSync(`rsvg-convert -w ${size} -h ${size} "${src}" -o "${out}"`);
  console.log(`✓ ${name} (${size}x${size})`);
}

// ICO (16 + 32 combined)
const ico16 = resolve(root, "public/favicon-16x16.png");
const ico32 = resolve(root, "public/favicon-32x32.png");
const icoOut = resolve(root, "src/app/favicon.ico");
execSync(`magick "${ico16}" "${ico32}" "${icoOut}"`);
console.log("✓ favicon.ico");

// Cleanup intermediate SVGs (keep icon.svg for browser)
execSync(`rm -f "${svgLargePath}" "${svgSmallPath}"`);

console.log("\nDone! Files in src/app/ and public/");
