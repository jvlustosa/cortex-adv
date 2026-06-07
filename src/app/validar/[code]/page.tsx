import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CertificateValidatorResult,
  ValidarPageShell,
} from "@/components/certificate-validator-result";
import { lookupCertificate } from "@/lib/certificates/lookup";
import {
  isCertificateCodeFormat,
  normalizeCertificateCode,
} from "@/lib/certificates/normalize";
import { SITE_URL } from "@/lib/site";

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code: raw } = await params;
  const code = normalizeCertificateCode(decodeURIComponent(raw));

  return {
    title: `Validar ${code}`,
    description: `Verificação do certificado Claude Academy ${code}.`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${SITE_URL}/validar/${encodeURIComponent(code)}`,
    },
  };
}

export default async function ValidarCodigoPage({ params }: PageProps) {
  const { code: raw } = await params;
  const code = normalizeCertificateCode(decodeURIComponent(raw));

  if (!code || !isCertificateCodeFormat(code)) {
    notFound();
  }

  const result = await lookupCertificate(code);

  return (
    <ValidarPageShell
      title={`Código ${code}`}
      subtitle="Resultado da verificação na base oficial Claude Academy."
    >
      <CertificateValidatorResult result={result} searchedCode={code} />
    </ValidarPageShell>
  );
}
