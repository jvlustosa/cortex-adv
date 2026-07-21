import { AulasShell } from "@/components/aulas/aulas-shell";
import { LessonCardsGrid } from "@/components/aulas/lesson-cards-grid";
import { CertificateProgress } from "@/components/members/certificate-progress";
import { VipGroupStep } from "@/components/members/vip-group-step";
import { isAdminUser } from "@/lib/admin/require-admin";
import { getUserCourseProgress } from "@/lib/course/progress";
import { requireCourseAccess } from "@/lib/course/require-access";
import { getMergedCourse } from "@/lib/lessons/merge-course";

export const metadata = {
  title: "Área de membros | Claude Cowork para advogados",
  description:
    "Aulas, progresso e certificado do curso completo Claude Academy para advogados.",
  keywords: [
    "área de membros Claude Academy",
    "aulas Claude advogados",
    "certificado IA jurídica",
  ],
  openGraph: {
    images: [{ url: "/og/membros.png", width: 1200, height: 630 }],
  },
};

export default async function AreaDeMembrosPage() {
  const { authOn, user, demoMode } = await requireCourseAccess("/area-de-membros");
  const [course, progress, isAdmin] = await Promise.all([
    getMergedCourse(),
    getUserCourseProgress(user?.id),
    isAdminUser(user),
  ]);

  // Admin e modo demo (localhost) veem tudo liberado — o resto respeita a trava
  // por tempo de cada módulo, contada de created_at.
  const bypassLock = demoMode || isAdmin;

  return (
    <AulasShell
      authOn={authOn}
      userEmail={user?.email}
      active="catalog"
      isAdmin={isAdmin}
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        <VipGroupStep />
        <LessonCardsGrid
          course={course}
          enrolledAt={user?.created_at ?? null}
          bypassLock={bypassLock}
          completedKeys={progress.completedKeys}
        />
        <CertificateProgress
          progress={progress}
          userName={user?.email?.split("@")[0] ?? null}
        />
      </main>
    </AulasShell>
  );
}
