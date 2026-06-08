import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { SITE_BRAND, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_BRAND} | Claude para Advogados | curso de IA generativa`,
    template: `%s | ${SITE_BRAND}`,
  },
  description:
    "Curso completo Claude para Advogados do Chat Jurídico: trilha em vídeo, Comunidade VIP de alunos e certificado ao concluir.",
  keywords: [
    "Claude Academy",
    "IA para advogados",
    "Claude para advocacia",
    "inteligência artificial escritório de advocacia",
    "automação jurídica",
    "IA generativa direito",
    "curso Claude advogados",
    "prompt engineering jurídico",
    "Claude Cowork",
    "Chat Jurídico",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${SITE_BRAND} | IA para advogados`,
    description:
      "Curso completo Claude Academy: automatize peças, rotinas e comunicação do escritório com Claude e Comunidade VIP.",
    locale: "pt_BR",
    type: "website",
    siteName: SITE_BRAND,
    url: SITE_URL,
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_BRAND} | IA para advogados`,
    description:
      "Curso completo Claude Academy do Chat Jurídico com Comunidade VIP de alunos.",
    images: ["/og/default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
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
