import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-sim-serif",
  subsets: ["latin"],
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-sim-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-sim-mono",
  subsets: ["latin"],
});

export default function SimuladorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      {children}
    </div>
  );
}
