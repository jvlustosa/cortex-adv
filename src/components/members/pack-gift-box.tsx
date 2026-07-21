const STYLE = `
  .pgb-glow   { transform-origin: 40px 24px; animation: pgb-pulse 2.4s ease-in-out infinite; }
  .pgb-claude { transform-origin: 40px 24px; animation: pgb-float 2.4s ease-in-out infinite; }
  .pgb-spark  { transform-origin: center; transform-box: fill-box; animation: pgb-twinkle 1.8s ease-in-out infinite; }
  .pgb-spark--a { animation-delay: 0s; }
  .pgb-spark--b { animation-delay: 0.4s; animation-duration: 2.2s; }
  .pgb-spark--c { animation-delay: 0.8s; animation-duration: 1.6s; }
  .pgb-spark--d { animation-delay: 1.2s; animation-duration: 2s; }
  .pgb-lid    { transform-origin: 40px 30px; animation: pgb-lid 2.4s ease-in-out infinite; }
  .pgb-accent-fill { fill: var(--accent); }
  .pgb-glow-0 { stop-color: var(--accent); stop-opacity: 0.55; }
  .pgb-glow-1 { stop-color: var(--accent); stop-opacity: 0.2; }
  .pgb-glow-2 { stop-color: var(--accent); stop-opacity: 0; }
  @keyframes pgb-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes pgb-pulse   { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.18); } }
  @keyframes pgb-twinkle { 0%,100% { opacity: 0.15; transform: scale(0.7); } 50% { opacity: 0.9; transform: scale(1); } }
  @keyframes pgb-lid     { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-1.5px) rotate(-6deg); } }
  @media (prefers-reduced-motion: reduce) {
    .pgb-glow, .pgb-claude, .pgb-spark, .pgb-lid { animation: none; }
  }
`;

/**
 * Caixa de presente 3D animada — brinde com a marca do Claude flutuando pra
 * fora e faíscas. Cor do wireframe = `currentColor`; brilho/marca/faíscas usam
 * `var(--accent)`. Animações respeitam `prefers-reduced-motion`. Uso único
 * (IDs de gradiente globais no SVG); reservado ao hero da Galeria Premium.
 */
export function PackGiftBox() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="pgbFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.38" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="pgbSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="pgbTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="pgbGlow" cx="50%" cy="50%">
          <stop offset="0%" className="pgb-glow-0" />
          <stop offset="55%" className="pgb-glow-1" />
          <stop offset="100%" className="pgb-glow-2" />
        </radialGradient>
      </defs>

      <style>{STYLE}</style>

      {/* Halo atrás da marca do Claude */}
      <circle className="pgb-glow" cx="40" cy="24" r="18" fill="url(#pgbGlow)" />

      {/* Faíscas */}
      <g className="pgb-accent-fill">
        <circle className="pgb-spark pgb-spark--a" cx="20" cy="18" r="1.1" />
        <circle className="pgb-spark pgb-spark--b" cx="60" cy="14" r="1.4" />
        <circle className="pgb-spark pgb-spark--c" cx="64" cy="26" r="0.9" />
        <circle className="pgb-spark pgb-spark--d" cx="16" cy="28" r="1" />
      </g>

      {/* Caixa 3D isométrica */}
      <g>
        <path
          d="M 50 38 L 70 30 L 70 62 L 50 70 Z"
          fill="url(#pgbSide)"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.45"
          strokeLinejoin="round"
        />
        <path
          d="M 18 38 L 50 38 L 50 70 L 18 70 Z"
          fill="url(#pgbFront)"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />
        <path
          d="M 18 38 L 50 38 L 70 30 L 38 30 Z"
          fill="url(#pgbTop)"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.4"
          strokeLinejoin="round"
        />

        {/* Fita e laço */}
        <rect x="32" y="38" width="4" height="32" fill="currentColor" opacity="0.35" />
        <path d="M 32 38 L 36 38 L 56 30 L 52 30 Z" fill="currentColor" opacity="0.28" />
        <rect x="50" y="38" width="3.6" height="32" fill="currentColor" opacity="0.32" />
        <circle cx="34" cy="38" r="2.3" fill="currentColor" opacity="0.45" />
      </g>

      {/* Tampa flutuante */}
      <g className="pgb-lid">
        <path
          d="M 14 34 L 46 34 L 66 26 L 34 26 Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />
        <path
          d="M 46 34 L 66 26 L 66 30 L 46 38 Z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.45"
          strokeLinejoin="round"
        />
        <path
          d="M 14 34 L 46 34 L 46 38 L 14 38 Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />
      </g>

      {/* Marca do Claude flutuando pra fora da caixa */}
      <g className="pgb-claude" transform="translate(32 12)">
        <svg width="16" height="16" viewBox="0 0 16 16" x="0" y="0" overflow="visible">
          <path
            className="pgb-accent-fill"
            d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z"
          />
        </svg>
      </g>
    </svg>
  );
}
