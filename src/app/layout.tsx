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
    default: "Cortex.adv.br — Claude Cowork para advogados",
    template: "%s — Cortex.adv.br",
  },
  description:
    "Mini curso Claude Cowork para advogados: automatize 100% do seu escritório. Convite para área de membros e grupo no WhatsApp.",
  openGraph: {
    title: "Cortex.adv.br — Claude Cowork",
    description:
      "Claude Cowork para advogados. Mini curso com acesso por convite e comunidade no WhatsApp.",
    locale: "pt_BR",
    type: "website",
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
