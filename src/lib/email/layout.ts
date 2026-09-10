import { SITE_BYLINE, SITE_NAME, SITE_URL } from "@/lib/site";

/** Paleta do app (`globals.css`) — e-mail não resolve CSS variables. */
export const EMAIL = {
  canvas: "#0a0a0a",
  surface: "#111111",
  foreground: "#e4e4e7",
  muted: "#a1a1aa",
  accent: "#d97757",
  onAccent: "#0a0a0a",
  border: "#1f1f1f",
} as const;

const LOGO_SRC = new URL(
  "/assets/images/claude-para-advogados-academy.png",
  SITE_URL,
).toString();

const FONT_SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const FONT_SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AcademyEmailInput = {
  greeting: string;
  paragraphs: string[];
  cta: { href: string; label: string };
  /** HTML já escapado (links internos). */
  noteHtml: string;
};

/**
 * Envelope transacional no visual do Claude Academy.
 * Tables + estilos inline: cliente de e-mail não carrega o CSS do site.
 */
export function renderAcademyEmail({
  greeting,
  paragraphs,
  cta,
  noteHtml,
}: AcademyEmailInput): string {
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${EMAIL.muted};">${escapeHtml(p)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:${EMAIL.canvas};font-family:${FONT_SANS};color:${EMAIL.foreground};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.canvas};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${EMAIL.surface};border-radius:18px;overflow:hidden;border:1px solid ${EMAIL.border};">
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid ${EMAIL.border};">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="${escapeHtml(LOGO_SRC)}" width="40" height="40" alt="" style="display:block;border-radius:6px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-family:${FONT_SERIF};font-size:22px;line-height:1.15;letter-spacing:-0.02em;color:${EMAIL.foreground};">${escapeHtml(SITE_NAME)}</div>
                      <div style="margin-top:2px;font-size:11px;letter-spacing:0.02em;color:${EMAIL.muted};">${escapeHtml(SITE_BYLINE)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:${EMAIL.foreground};">${escapeHtml(greeting)}</p>
                ${body}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                  <tr>
                    <td align="center" style="border-radius:999px;background:${EMAIL.accent};">
                      <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:${EMAIL.onAccent};text-decoration:none;border-radius:999px;">
                        ${escapeHtml(cta.label)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.65;color:${EMAIL.muted};">
                  ${noteHtml}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${EMAIL.border};">
                <span style="font-size:12px;color:${EMAIL.muted};">${escapeHtml(SITE_NAME)} · ${escapeHtml(SITE_BYLINE)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
