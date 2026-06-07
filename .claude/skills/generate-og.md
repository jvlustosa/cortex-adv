---
name: generate-og
description: Gera imagens OG (1200x630 PNG) estáticas para social media preview de todas as páginas do projeto
---

# Gerar OG Images

Comando: `npm run og` (ou `node scripts/generate-og-images.mjs`)

## O que faz

Gera PNGs estáticos em `public/og/` para cada página do app, seguindo o design system (dark mode, tokens de cor, tipografia DM Sans).

## Quando usar

- Quando o conteúdo das páginas mudar (título, descrição, pills)
- Quando novas páginas forem criadas
- Quando o design system mudar (cores, fontes)

## Como adicionar uma nova página

Editar `scripts/generate-og-images.mjs` e adicionar um objeto ao array `pages`:

```js
{
  name: "nova-pagina",  // gera public/og/nova-pagina.png
  build: () =>
    container([
      glow(),
      tag("Tag da página"),
      title("Título principal"),
      subtitle("Subtítulo descritivo"),
      pills(["Pill 1", "Pill 2"]),  // opcional
      footer(),
    ]),
}
```

Depois, adicionar o metadata na página Next.js:

```tsx
openGraph: {
  images: [{ url: "/og/nova-pagina.png", width: 1200, height: 630 }],
},
```

## Componentes disponíveis

- `glow(top, right, size, alpha)` — radial glow decorativo
- `orbDots()` — grid de dots estilo AI Orb (só na home)
- `tag(text)` — texto accent no topo
- `title(text, fontSize?)` — título principal (default 56px)
- `subtitle(text)` — subtítulo muted
- `pills(items[])` — pills com borda accent
- `footer()` — logo Claude Academy + claudeacademy.chatjuridico.com.br
- `container(children[])` — wrapper com background gradient

## Dependências

- `satori` — renderiza virtual DOM para SVG
- `sharp` — converte SVG para PNG otimizado
