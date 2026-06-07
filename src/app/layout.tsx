import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BRAND_FULL, BRAND_LOGO_SRC, BRAND_SITE_URL } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_SITE_URL),
  title: {
    default: `${BRAND_FULL} — Curso de Claude e IA generativa para advogados`,
    template: `%s — ${BRAND_FULL}`,
  },
  description:
    "Claude Academy by Chat Jurídico — curso de Claude e IA generativa para advogados, em breve. Aprenda a automatizar peças, rotinas e comunicação do escritório. Comunidade no WhatsApp e área de membros.",
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
      { url: BRAND_LOGO_SRC, type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${BRAND_FULL} — IA para advogados`,
    description:
      "Curso de Claude e IA generativa para advogados — em breve. Automatize peças, rotinas e comunicação do seu escritório.",
    locale: "pt_BR",
    type: "website",
    siteName: BRAND_FULL,
    url: BRAND_SITE_URL,
    images: [{ url: "/og/home.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_FULL} — IA para advogados`,
    description:
      "Curso de Claude e IA generativa para advogados — em breve. Comunidade no WhatsApp.",
    images: ["/og/home.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BRAND_SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
