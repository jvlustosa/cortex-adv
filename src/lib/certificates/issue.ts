import { createAdminClient } from "@/lib/supabase/admin";
import {
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";
import { COURSE } from "@/data/course-content";
import { SITE_URL } from "@/lib/site";
import { normalizeCertificateCode } from "./normalize";

const DEFAULT_WORKLOAD_HOURS = 12;
const MAX_CODE_ATTEMPTS = 8;

export type IssuedCertificate = {
  code: string;
  recipientName: string;
  courseTitle: string;
  workloadHours: number;
  issuedAt: string;
  verifyUrl: string;
};

type CertRow = {
  code: string;
  recipient_name: string;
  course_title: string;
  workload_hours: number;
  issued_at: string;
};

function toIssued(row: CertRow): IssuedCertificate {
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

function generateCode(year: number): string {
  // CA-YYYY-NNNNN — 5 dígitos pra reduzir colisão (padrão aceita 4+).
  const n = Math.floor(10000 + Math.random() * 90000);
  return `CA-${year}-${n}`;
}

/**
 * Busca certificado ativo do usuário. Não emite.
 */
export async function getCertificateForUser(
  userId: string,
): Promise<IssuedCertificate | null> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("certificates")
    .select("code, recipient_name, course_title, workload_hours, issued_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[certificates/get]", error.message);
    return null;
  }
  if (!data) return null;
  return toIssued(data as CertRow);
}

/**
 * Emite (ou reutiliza) certificado do aluno. Idempotente por user_id.
 * Só chamar quando o progresso estiver 100%.
 */
export async function getOrIssueCertificate(params: {
  userId: string;
  recipientName: string;
  courseTitle?: string;
  workloadHours?: number;
}): Promise<IssuedCertificate | null> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return null;

  const existing = await getCertificateForUser(params.userId);
  if (existing) return existing;

  const recipientName = params.recipientName.trim();
  if (!recipientName) return null;

  const courseTitle = params.courseTitle ?? COURSE.title;
  const workloadHours = params.workloadHours ?? DEFAULT_WORKLOAD_HOURS;
  const year = new Date().getFullYear();
  const admin = createAdminClient();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode(year);
    const { data, error } = await admin
      .from("certificates")
      .insert({
        code,
        recipient_name: recipientName,
        course_title: courseTitle,
        workload_hours: workloadHours,
        user_id: params.userId,
      })
      .select("code, recipient_name, course_title, workload_hours, issued_at")
      .single();

    if (!error && data) {
      return toIssued(data as CertRow);
    }

    // Colisão de código único — tenta de novo. Outro erro = aborta.
    const isConflict =
      error?.code === "23505" ||
      /duplicate|unique/i.test(error?.message ?? "");
    if (!isConflict) {
      console.error("[certificates/issue]", error?.message);
      // Race: outro request emitiu no meio — busca de novo.
      const raced = await getCertificateForUser(params.userId);
      if (raced) return raced;
      return null;
    }
  }

  console.error("[certificates/issue] esgotou tentativas de código único");
  return getCertificateForUser(params.userId);
}
