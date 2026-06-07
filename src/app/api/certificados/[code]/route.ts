import { NextResponse } from "next/server";
import { lookupCertificate } from "@/lib/certificates/lookup";
import {
  isCertificateCodeFormat,
  normalizeCertificateCode,
} from "@/lib/certificates/normalize";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code: raw } = await context.params;
  const code = normalizeCertificateCode(decodeURIComponent(raw));

  if (!code || !isCertificateCodeFormat(code)) {
    return NextResponse.json(
      { valid: false, error: "Código inválido." },
      { status: 400 },
    );
  }

  const result = await lookupCertificate(code);

  if (result.status === "unconfigured") {
    return NextResponse.json(
      { valid: false, error: "Serviço indisponível." },
      { status: 503 },
    );
  }

  if (result.status === "invalid") {
    return NextResponse.json({ valid: false, code }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    certificate: result.certificate,
  });
}
