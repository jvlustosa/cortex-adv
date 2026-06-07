import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/enabled";
import { DEMO_CERTIFICATE_CODE } from "./constants";
import { isCertificateCodeFormat, normalizeCertificateCode } from "./normalize";
import type { CertificateLookupResult, CertificatePublic } from "./types";

type RpcRow = {
  code: string;
  recipient_name: string;
  course_title: string;
  workload_hours: number;
  issued_at: string;
};

const DEMO_CERTIFICATES: Record<string, Omit<CertificatePublic, "verifyUrl">> = {
  [DEMO_CERTIFICATE_CODE]: {
    code: DEMO_CERTIFICATE_CODE,
    recipientName: "Dra. Maria Silva",
    courseTitle: "Claude Academy: IA generativa para advogados",
    workloadHours: 12,
    issuedAt: "2026-06-01",
  },
};

function toPublic(row: RpcRow): CertificatePublic {
  const code = normalizeCertificateCode(row.code);
  return {
    code,
    recipientName: row.recipient_name,
    courseTitle: row.course_title,
    workloadHours: row.workload_hours,
    issuedAt: row.issued_at,
    verifyUrl: `${SITE_URL}/validar/${encodeURIComponent(code)}`,
  };
}

function demoLookup(code: string): CertificateLookupResult {
  const demo = DEMO_CERTIFICATES[code];
  if (!demo) {
    return { status: "invalid", code };
  }
  return {
    status: "valid",
    certificate: {
      ...demo,
      verifyUrl: `${SITE_URL}/validar/${encodeURIComponent(code)}`,
    },
  };
}

export async function lookupCertificate(
  rawCode: string,
): Promise<CertificateLookupResult> {
  const code = normalizeCertificateCode(rawCode);

  if (!code) {
    return { status: "invalid", code: "" };
  }

  if (!isCertificateCodeFormat(code)) {
    return { status: "invalid", code };
  }

  if (isDemoMode()) {
    return demoLookup(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { status: "unconfigured" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_certificate", {
      p_code: code,
    });

    if (error) {
      console.error("[certificates/lookup]", error.message);
      if (isDemoMode() && code === DEMO_CERTIFICATE_CODE) {
        return demoLookup(code);
      }
      return { status: "unconfigured" };
    }

    const row = (Array.isArray(data) ? data[0] : null) as RpcRow | undefined;

    if (!row) {
      return { status: "invalid", code };
    }

    return { status: "valid", certificate: toPublic(row) };
  } catch (err) {
    console.error("[certificates/lookup]", err);
    if (isDemoMode() && code === DEMO_CERTIFICATE_CODE) {
      return demoLookup(code);
    }
    return { status: "unconfigured" };
  }
}
