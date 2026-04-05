import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export function createOgImage({
  tag,
  title,
  subtitle,
  pills,
}: {
  tag: string;
  title: string;
  subtitle: string;
  pills?: string[];
}) {
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
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-60px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,165,116,0.12) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            fontSize: "18px",
            color: "#d4a574",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          {tag}
        </div>

        <div
          style={{
            marginTop: "24px",
            fontSize: "56px",
            fontWeight: 700,
            color: "#e8e4dc",
            lineHeight: 1.1,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "20px",
            fontSize: "26px",
            color: "#8c8a85",
            lineHeight: 1.4,
            maxWidth: "700px",
          }}
        >
          {subtitle}
        </div>

        {pills && pills.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "36px",
              flexWrap: "wrap",
            }}
          >
            {pills.map((s) => (
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
        )}

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
    { ...ogSize }
  );
}
