import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cortex.adv.br"),
  title: {
    default:
      "Cortex.adv.br — IA para advogados | Curso de Claude e IA generativa",
    template: "%s — Cortex.adv.br",
  },
  description:
    "Curso de Claude e IA generativa para advogados — disponível em breve. Aprenda a automatizar peças, rotinas e comunicação do escritório. Comunidade no WhatsApp e área de membros com acesso por convite.",
  keywords: [
    "IA para advogados",
    "Claude para advocacia",
    "inteligência artificial escritório de advocacia",
    "automação jurídica",
    "IA generativa direito",
    "Claude vs ChatGPT advogado",
    "curso IA advogados",
    "prompt engineering jurídico",
    "Claude Cowork",
    "Cortex adv",
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Cortex.adv.br — IA para advogados",
    description:
      "Curso de Claude e IA generativa para advogados — em breve. Automatize peças, rotinas e comunicação do seu escritório.",
    locale: "pt_BR",
    type: "website",
    siteName: "Cortex.adv.br",
    images: [{ url: "/og/home.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cortex.adv.br — IA para advogados",
    description:
      "Curso de Claude e IA generativa para advogados — em breve. Comunidade no WhatsApp.",
    images: ["/og/home.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://cortex.adv.br",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
