import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { SIMULATOR_FAQ } from "./simulator-data";
import { SimulatorClient } from "./simulator-client";

const PATH = "/simulador-custo-claude";
const CANONICAL = `${SITE_URL}${PATH}/`;

export const metadata: Metadata = {
  title:
    "Simulador de custo Claude para advogados | Calculadora de tokens e MTok",
  description:
    "Simule quanto custa cada peça jurídica no Claude: Haiku, Sonnet 5, Opus 4.8 e Fable 5. Ajuste páginas, effort, Batch API e cache. Projeção mensal em USD.",
  keywords: [
    "simulador custo Claude",
    "calculadora tokens Claude advogados",
    "quanto custa Claude API",
    "preço Claude Sonnet 5",
    "MTok Claude advocacia",
    "custo IA escritório advocacia",
    "Claude para advogados preço",
    "calculadora custo tokens jurídico",
    "Batch API Claude",
    "cache Claude API",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Simulador de custo Claude para advogados",
    description:
      "Calcule o custo por requisição e projeção mensal de Claude no escritório — modelos, tokens, descontos e cenários jurídicos prontos.",
    url: CANONICAL,
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og/simulador-custo-claude.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulador de custo Claude para advogados",
    description:
      "Quanto custa essa peça? Simule Haiku, Sonnet 5, Opus e Fable com cenários de petição, parecer e autos.",
    images: ["/og/simulador-custo-claude.png"],
  },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulador de custo Claude para advogados",
  description:
    "Calculadora interativa de custo por requisição e projeção mensal de modelos Claude (Haiku, Sonnet 5, Opus 4.8, Fable 5) para tarefas jurídicas.",
  url: CANONICAL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Advogados e escritórios de advocacia",
  },
  inLanguage: "pt-BR",
  provider: {
    "@type": "Organization",
    name: "Claude Academy · Chat Jurídico",
    url: SITE_URL,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SIMULATOR_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Claude Academy",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Simulador de custo Claude",
      item: CANONICAL,
    },
  ],
};

export default function SimuladorCustoClaudePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SimulatorClient />
    </>
  );
}
