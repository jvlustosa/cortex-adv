import { CourseCertificate } from "@/components/members/course-certificate";
import { getUserCourseProgress } from "@/lib/course/progress";
import { requireCourseAccess } from "@/lib/course/require-access";
import { COURSE } from "@/data/course-content";
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
  // Nome próprio em certificado vai capitalizado (o full_name pode vir minúsculo).
  const recipientName = capitalizeName(rawName);

  // Prévia até concluir 100% (não emitido). Em modo demo, mostra a prévia também.
  const isPreview = demoMode || !progress.isComplete;

  const issuedDateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 print:bg-white print:p-0">
      <CourseCertificate
        recipientName={recipientName}
        courseTitle={COURSE.title}
        workloadHours={WORKLOAD_HOURS}
        issuedDateLabel={issuedDateLabel}
        code={null}
        verifyUrl={SITE_URL}
        isPreview={isPreview}
      />
    </main>
  );
}
