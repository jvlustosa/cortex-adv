import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CertificateValidatorForm } from "@/components/certificate-validator-form";
import { ValidarPageShell } from "@/components/certificate-validator-result";
import { DEMO_CERTIFICATE_CODE } from "@/lib/certificates/constants";
import {
  certificateVerifyPath,
  normalizeCertificateCode,
} from "@/lib/certificates/normalize";
import { SITE_URL } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Validar certificado",
  description:
    "Verifique a autenticidade de um certificado Claude Academy pelo código impresso no documento.",
  alternates: {
    canonical: `${SITE_URL}/validar/`,
  },
};

type PageProps = {
  searchParams: Promise<{ codigo?: string }>;
};

export default async function ValidarPage({ searchParams }: PageProps) {
  const { codigo } = await searchParams;
  if (codigo?.trim()) {
    redirect(certificateVerifyPath(normalizeCertificateCode(codigo)));
  }

  return (
    <ValidarPageShell
      title="Validar certificado"
      subtitle="Informe o código CA-XXXX-XXXX impresso no certificado para confirmar autenticidade."
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <CertificateValidatorForm />
      </div>
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Exemplo de URL:{" "}
        <Link
          href={certificateVerifyPath(DEMO_CERTIFICATE_CODE)}
          className="font-mono text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
        >
          /validar/{DEMO_CERTIFICATE_CODE}
        </Link>
      </p>
    </ValidarPageShell>
  );
}
