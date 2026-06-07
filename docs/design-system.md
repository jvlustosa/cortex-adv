# Cortex.adv.br — design system

This document describes the **tokens and UI patterns actually used in the codebase** (Next.js 16, React 19, Tailwind CSS v4). Source of truth: `src/app/globals.css`, `src/app/layout.tsx`, and the page/components under `src/`.

---

## Stack

- **Styling:** Tailwind v4 with `@import "tailwindcss"` and `@theme inline` in `globals.css`.
- **Class merging:** `clsx` + `tailwind-merge` via `cn()` in `src/lib/utils.ts` (used by `AIOrb` and anywhere you extend classes).
- **Icons:** `lucide-react`; WhatsApp mark in `src/components/icons/whatsapp.tsx`.
- **No shadcn/ui** in this repo — patterns are hand-rolled Tailwind + one CSS module for the FAQ.

---

## Color tokens (CSS variables)

Defined on `:root` in `src/app/globals.css`. Components reference them as **`var(--token)`** inside arbitrary values, e.g. `text-[var(--foreground)]`, `bg-[var(--accent)]`.

### Dark (default)

| Token | Hex | Role |
|--------|-----|------|
| `--background` | `#191918` | Page / base canvas |
| `--foreground` | `#e8e4dc` | Primary text |
| `--muted` | `#8c8a85` | Secondary text, captions |
| `--accent` | `#d4a574` | Primary actions, highlights, links-on-accent |
| `--accent-hover` | `#e0b88a` | Hover on primary actions |
| `--surface` | `#232322` | Cards, inputs, elevated panels |
| `--border` | `#2e2d2b` | Dividers, borders |
| `--ring` | `#d4a57433` | Focus ring (accent at ~20% alpha) |
| `--surface-raised` | `#2a2a28` | Icon chips, raised strips |
| `--surface-overlay` | `#1f1f1e` | Section bands (e.g. skills strip) |
| `--danger` | `#e5736a` | Errors (e.g. login message) |
| `--success` | `#7ec699` | Success (defined; use as needed) |

### Light (`prefers-color-scheme: light`)

Same token names; values swap to a warm paper palette (e.g. `--background` `#faf9f6`, `--foreground` `#1a1a19`, `--accent` `#b8845a`, `--accent-hover` `#a07248`, etc.). **Always use the variables** so both themes stay aligned.

### Tailwind theme bridge

`@theme inline` exposes:

- `background`, `foreground`, `surface`, `surface-raised`, `muted`, `accent`, `accent-hover`, `border`, `danger`, `success` as Tailwind colors (e.g. `bg-background` if you use the theme keys — the codebase mostly uses `bg-[var(--background)]` style instead).
- `--font-sans` → DM Sans stack; `--font-serif` → Instrument Serif stack.

---

## Typography

### Fonts (Next `next/font/google` in `src/app/layout.tsx`)

| Role | Font | Weights | CSS variable |
|------|------|---------|----------------|
| Body / UI | **DM Sans** | 400, 500, 600 | `--font-dm-sans` |
| Headings / brand wordmark | **Instrument Serif** | 400 | `--font-instrument-serif` |

`html` gets both font variables + `antialiased`. **`html { font-size: 112.5%; }`** — root is 18px, so `rem`-based third-party or CSS module sizes scale up.

### Utility

- **Serif display:** `font-serif` class in `globals.css` maps to Instrument Serif.
- **Body:** `body` uses DM Sans; `line-height: 1.65`.

### Patterns in UI (Tailwind)

- **Hero H1:** `font-serif text-4xl … md:text-5xl lg:text-[3.35rem]`, `leading-[1.08]`, `tracking-tight`, `text-[var(--foreground)]`.
- **Section H2:** `font-serif text-2xl md:text-3xl`, `tracking-tight`.
- **Brand lockup:** `font-serif text-xl` (header) or `text-lg` (compact headers); subtitle `text-xs text-[var(--muted)]`.
- **Eyebrow / kicker:** `text-sm font-medium tracking-wide text-[var(--accent)]` or `uppercase tracking-widest` for “Quiz · 2 minutos” style.
- **Lead paragraph:** `text-xl` / `md:text-2xl` `font-medium` `text-[var(--foreground)]/95`.
- **Body copy:** `text-lg` with `text-[var(--muted)]` and `leading-relaxed`, or `text-sm` / `text-base` for dense UI.
- **Mono accents:** `font-mono text-sm text-[var(--accent)]` for numbered lists (`membros`).
- **Selection:** `::selection` uses `background: var(--accent)` and `color: var(--background)`.

---

## Layout & spacing

- **Full viewport columns:** `flex min-h-[100dvh] flex-col` (or `min-h-dvh` on `/grupo` only).
- **Content width:** Primary marketing layout uses **`max-w-5xl mx-auto px-6`**. Narrower app shells use **`max-w-2xl`** (membros) or **`max-w-md` / `max-w-lg` / `max-w-xl`** for forms, quiz, and CTAs.
- **Vertical rhythm:** Section blocks commonly `py-16`; hero `pt-16 pb-20 md:pt-24 md:pb-28`; footer `py-8`.
- **Grids:** `gap-6` or `gap-12`; skills grid `sm:grid-cols-2 lg:grid-cols-3`.
- **Header:** `border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl` (home); membros uses `bg-[var(--surface)]/90 backdrop-blur`.

---

## Radius, shadow, depth

- **Pills / primary CTAs:** `rounded-full`.
- **Cards, panels, inputs, quiz options:** `rounded-2xl` or `rounded-xl`.
- **Small chips / kbd:** `rounded-lg` or `rounded-md` for option letter badges.
- **Hero feature card:** `rounded-3xl border border-[var(--border)] bg-[var(--surface)]` + `shadow-[0_0_40px_-12px_var(--accent)/15]`.
- **Cards / skill tiles:** `rounded-2xl border border-[var(--border)]`; hover `hover:border-[var(--accent)]/30` (or `/40`).
- **Shadows:** Mostly `shadow-sm` on CTAs and login card; FAQ uses subtle `box-shadow` on hover in CSS.

---

## Atmosphere (marketing hero)

- **Gradient wash:** absolutely positioned `rounded-full` blob, `bg-gradient-to-b from-[var(--accent)]/10 to-transparent`, `blur-[100px]`, `opacity-40`, `-z-10`.

---

## Buttons & links

### Primary CTA (filled)

`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5` (or `px-8 py-4` for emphasis) `text-sm font-medium text-[var(--background)] shadow-sm transition hover:bg-[var(--accent-hover)]`.

Icon + text allowed; Lucide icons often `size-4` / `size-5` with `opacity-80` where paired with arrows.

### Secondary (outline)

`rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/35` (home) or `/40` (quiz CTA).

### Tertiary / nav

`rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)]` (desktop nav links).

### Form submit (login/signup)

`rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--background)]` (signup once uses `text-white` — minor inconsistency).

### Ghost / text button

Example: quiz “Refazer” — `text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]` with icon `size-4`.

### Sign out

`rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]`.

### Text links

`underline underline-offset-4` with `hover:text-[var(--foreground)]` (footer), or accent `text-[var(--accent)] underline underline-offset-4 hover:opacity-90` (forms).

---

## Forms

**Shared input shell** (`login-form.tsx`; `signup-form.tsx` is similar with a slightly different focus ring):

```txt
rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3
text-[var(--foreground)] placeholder:text-[var(--muted)]/50
outline-none transition
focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]
```

(signup uses `focus:ring-[var(--accent)]/20` instead of `--ring`.)

**Labels:** `flex flex-col gap-2 text-sm text-[var(--muted)]`.

**Form layout:** `flex w-full max-w-sm flex-col gap-4`.

**Card shell (login):** `max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm`.

---

## FAQ (WhatsApp metaphor)

Implemented with **`src/components/faq-whatsapp.module.css`** + `faq-whatsapp.tsx`. It consumes the same CSS variables.

Notable constants:

- **Section:** `border-top: 1px solid var(--border)`, `background: var(--background)`, vertical padding `3.5rem` (3rem on small screens).
- **Container:** `max-width: 680px`, horizontal padding `1.25rem`.
- **Title:** Instrument Serif, `2rem` (1.5rem mobile), weight 800 (note: heavier than page H2s).
- **Bubbles:** `border-radius: 12px` with asymmetric radii for “tail” bubbles; question side `var(--surface)` + `var(--border)`; answer side `color-mix` accent into surface/border.
- **Focus:** `outline: 3px solid var(--ring); outline-offset: 2px; border-radius: 12px`.
- **Avatars:** 34px circle (28px mobile); toggle icon 30px circle with `color-mix` accent background.

---

## Quiz-specific patterns

- **Progress:** `h-1 w-full bg-[var(--border)]` track; fill `h-full bg-[var(--accent)] transition-all duration-500 ease-out`.
- **Question title:** `font-serif text-2xl md:text-3xl leading-snug tracking-tight`.
- **Options:** full-width `rounded-xl border px-5 py-4 text-left text-sm`; default `border-[var(--border)] bg-[var(--surface)]`; hover `hover:border-[var(--accent)]/40 hover:bg-[var(--surface-raised)]`; selected `border-[var(--accent)] bg-[var(--accent)]/10`.
- **Letter badge:** `size-6 rounded-md text-xs font-medium`; selected `bg-[var(--accent)] text-[var(--background)]`; idle `bg-[var(--surface-raised)] text-[var(--muted)]`.
- **Kbd hint:** `rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]`.
- **Confetti palette (canvas):** `#d4a574`, `#e0b88a`, `#c8956c`, `#8c8a85`, `#e8e4dc`, `#b8845a` — aligns with warm neutrals + accent.

---

## AI orb (`AIOrb`)

Canvas-based brand mark; sizes:

| Size | Canvas px | Particles | Glow |
|------|-----------|------------|------|
| `sm` | 24 | 80 | 2 |
| `md` | 40 | 150 | 3 |
| `lg` | 72 | 400 | 4 |

Particle color is **HSL** driven: hue ~`28 + depth * 8`, saturation ~`45–70%`, lightness ~`40–68%`, alpha tied to depth — warm gold/amber consistent with `--accent`.

---

## Exception: `/grupo` landing

`src/app/grupo/page.tsx` does **not** use the global Cortex tokens. It uses a fixed dark gradient (`#0c0c0e` → `#111113`), **Zinc-like** text (`#a1a1aa`, `#71717a`), white headings, WhatsApp **`#25d366`** on the main button, and a custom QR frame (`#1a1a1d` + rgba border/shadow). Treat it as a **separate micro-landing** if you extend the system.

---

## Accessibility & motion

- FAQ module: **`prefers-reduced-motion: reduce`** removes the answer height transition.
- Focus styles: ring via `--ring` on FAQ buttons; form inputs use `focus:ring-2`.
- Semantic HTML: sections, headers, `aria-expanded` on FAQ (see component).

---

## File map (quick reference)

| Concern | File(s) |
|---------|---------|
| Tokens + theme + base typography | `src/app/globals.css` |
| Fonts on `html` | `src/app/layout.tsx` |
| Marketing layout / components | `src/app/page.tsx` |
| Auth UI | `src/app/login/page.tsx`, `src/components/login-form.tsx`, `src/components/signup-form.tsx` |
| Quiz | `src/app/quiz/quiz-client.tsx` |
| Membros | `src/app/membros/page.tsx` |
| FAQ | `src/components/faq-whatsapp.tsx`, `faq-whatsapp.module.css` |
| Brand orb | `src/components/ai-orb.tsx` |
| Grupo exception | `src/app/grupo/page.tsx` |

---

*Generated from repository state; if tokens or classes drift, update this doc alongside `globals.css` and the main layout components.*
