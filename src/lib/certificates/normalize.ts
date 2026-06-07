import { CERTIFICATE_CODE_PATTERN } from "./constants";

export function normalizeCertificateCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isCertificateCodeFormat(code: string): boolean {
  return CERTIFICATE_CODE_PATTERN.test(code);
}

export function certificateVerifyPath(code: string): string {
  return `/validar/${encodeURIComponent(normalizeCertificateCode(code))}`;
}
