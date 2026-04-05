import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Cortex.adv.br — IA generativa para advogados | Mini curso gratuito de Claude";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #191918 0%, #232322 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Orb dots decoration */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "80px",
            display: "flex",
            flexWrap: "wrap",
            width: "180px",
            height: "180px",
            gap: "8px",
            opacity: 0.6,
          }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: `${6 + (i % 5) * 2}px`,
                height: `${6 + (i % 5) * 2}px`,
                borderRadius: "50%",
                background: `hsla(${28 + (i % 8) * 2}, ${50 + (i % 6) * 5}%, ${45 + (i % 7) * 4}%, ${0.3 + (i % 5) * 0.15})`,
              }}
            />
          ))}
        </div>

        {/* Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            color: "#d4a574",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Mini curso gratuito + Comunidade no WhatsApp
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: "24px",
            fontSize: "64px",
            fontWeight: 700,
            color: "#e8e4dc",
            lineHeight: 1.1,
            maxWidth: "800px",
          }}
        >
          IA generativa para advogados
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "28px",
            color: "#8c8a85",
            lineHeight: 1.4,
            maxWidth: "700px",
          }}
        >
          Aprenda a usar o Claude no seu escritório — prompts, automações e
          fluxos completos
        </div>

        {/* Skills pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          {[
            "Geração de peças",
            "Pesquisa jurídica",
            "Automação",
            "Relatórios",
            "Prazos",
          ].map((s) => (
            <div
              key={s}
              style={{
                padding: "8px 20px",
                borderRadius: "100px",
                border: "1px solid #2e2d2b",
                background: "#232322",
                color: "#d4a574",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "20px",
            color: "#8c8a85",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#d4a574",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#191918",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            C
          </div>
          cortex.adv.br
        </div>
      </div>
    ),
    { ...size }
  );
}
