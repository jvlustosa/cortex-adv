import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/**
 * Conector: plugue encaixando na tomada, com cabo saindo. Métrica alinhada aos
 * ícones Lucide da galeria (24x24, traço em `currentColor`) — os pinos usam
 * traço mais fino pra não virar um bloco sólido quando renderiza a 16–20px.
 */
export function PlugConnectionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden
    >
      {/* Tomada */}
      <rect x="2" y="5" width="7.5" height="14" rx="2.2" />
      {/* Plugue */}
      <rect x="14" y="7.5" width="5.5" height="9" rx="1.8" />
      {/* Pinos */}
      <path d="M9.5 9.6h4.5" strokeWidth="1.2" />
      <path d="M9.5 14.4h4.5" strokeWidth="1.2" />
      {/* Cabo */}
      <path d="M19.5 12h1.2a1.8 1.8 0 0 1 1.8 1.8V19" />
    </svg>
  );
}
