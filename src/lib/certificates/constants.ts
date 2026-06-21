/** Código exibido na prévia do certificado (demo + seed na migration). */
export const DEMO_CERTIFICATE_CODE = "CA-2026-48271";

export const CERTIFICATE_CODE_PATTERN = /^CA-\d{4}-\d{4,}$/i;

export const CERTIFICATE_LABEL = "Certificado de conclusão";

export const CERTIFICATE_COURSE_LINE = "IA generativa para advogados";

export const CERTIFICATE_PREVIEW_BADGE = "Exemplo · 2026";

export const CERTIFICATE_DEMO_RECIPIENT = "Dra. Maria Silva";

export const CERTIFICATE_DEMO_DATE = "Junho de 2026";

export const CERTIFICATE_MENTOR_ROLE = "Mentor do curso · Chat Jurídico";

export const CERTIFICATE_MENTOR_NAME = "Prof. Marcos Vilas Boas";

/** Texto da assinatura manuscrita (fonte script) sobre a linha de assinatura. */
export const CERTIFICATE_MENTOR_SIGNATURE = "Marcos Vilas Boas";

/**
 * Inscrição na OAB do mentor (Marcos Vinicius Castelan Vilas Boas).
 * Vazio = linha não é exibida.
 */
export const CERTIFICATE_MENTOR_OAB = "OAB/PR 73.759";

/** Texto central do certificado, após o nome do aluno. */
export function certificateCompletionText(courseTitle: string) {
  return `concluiu com aproveitamento o curso ${courseTitle}, com foco em Claude Cowork, peças jurídicas e automação do escritório.`;
}
