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
      "Cortex.adv.br — IA para advogados | Mini curso gratuito de Claude e IA generativa",
    template: "%s — Cortex.adv.br",
  },
  description:
    "Mini curso gratuito de Claude e IA generativa para advogados. Aprenda a automatizar peças, rotinas e comunicação do escritório. Comunidade no WhatsApp e área de membros com acesso por convite.",
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
      "Mini curso gratuito de Claude e IA generativa para advogados. Automatize peças, rotinas e comunicação do seu escritório.",
    locale: "pt_BR",
    type: "website",
    siteName: "Cortex.adv.br",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cortex.adv.br — IA para advogados",
    description:
      "Mini curso gratuito de Claude e IA generativa para advogados. Comunidade no WhatsApp.",
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
