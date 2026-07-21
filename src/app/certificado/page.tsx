import { CourseCertificate } from "@/components/members/course-certificate";
import { getOrIssueCertificate } from "@/lib/certificates/issue";
import { getUserCourseProgress } from "@/lib/course/progress";
import { requireCourseAccess } from "@/lib/course/require-access";
import { COURSE } from "@/data/course-content";
import { DEMO_CERTIFICATE_CODE } from "@/lib/certificates/constants";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Seu certificado | Claude Academy",
  robots: { index: false, follow: false },
};

const WORKLOAD_HOURS = 12;

function capitalizeName(value: string): string {
  return value
    .split(/[.\-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CertificadoPage() {
  const { user, demoMode } = await requireCourseAccess("/certificado");
  const progress = await getUserCourseProgress(user?.id);

  const fullName = (
    user?.user_metadata?.full_name as string | undefined
  )?.trim();
  const rawName =
    fullName || user?.email?.split("@")[0] || "Aluno(a) Claude Academy";
  const recipientName = capitalizeName(rawName);

  const isPreview = demoMode || !progress.isComplete;

  let code: string | null = null;
  let issuedDateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  let verifyUrl = SITE_URL;

  if (!isPreview && user?.id) {
    const issued = await getOrIssueCertificate({
      userId: user.id,
      recipientName,
      courseTitle: COURSE.title,
      workloadHours: WORKLOAD_HOURS,
    });
    if (issued) {
      code = issued.code;
      verifyUrl = issued.verifyUrl;
      issuedDateLabel = new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${issued.issuedAt}T12:00:00Z`));
    }
  } else if (demoMode) {
    // Prévia demo: código de exemplo (seed), sem emitir de verdade.
    code = DEMO_CERTIFICATE_CODE;
    verifyUrl = `${SITE_URL}/validar/${DEMO_CERTIFICATE_CODE}`;
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 print:bg-white print:p-0">
      <CourseCertificate
        recipientName={recipientName}
        courseTitle={COURSE.title}
        workloadHours={WORKLOAD_HOURS}
        issuedDateLabel={issuedDateLabel}
        code={code}
        verifyUrl={verifyUrl}
        isPreview={isPreview}
      />
    </main>
  );
}
