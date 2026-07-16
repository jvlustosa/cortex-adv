import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AulasShell } from "@/components/aulas/aulas-shell";
import { CourseArea } from "@/components/members/course-area";
import { isAdminUser } from "@/lib/admin/require-admin";
import { computeModuleAccess } from "@/lib/course/module-access";
import { getUserCourseProgress } from "@/lib/course/progress";
import { requireCourseAccess } from "@/lib/course/require-access";
import { findMergedLesson, getMergedCourse } from "@/lib/lessons/merge-course";

type PageProps = {
  params: Promise<{ modulo: string; aula: string }>;
};

function CourseSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-[var(--surface)]" />
          <div className="h-20 rounded-lg bg-[var(--surface)]" />
          <div className="h-20 rounded-lg bg-[var(--surface)]" />
        </div>
        <div className="aspect-video rounded-xl bg-[var(--surface)]" />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { modulo, aula } = await params;
  const course = await getMergedCourse();
  const { module, lesson } = findMergedLesson(course, modulo, aula);

  if (!module || !lesson) {
    return { title: "Aula não encontrada" };
  }

  return {
    title: `${lesson.title} | ${module.title}`,
    description: lesson.description,
  };
}

export default async function AulaPlayerPage({ params }: PageProps) {
  const { modulo, aula } = await params;
  const course = await getMergedCourse();
  const { module, lesson } = findMergedLesson(course, modulo, aula);

  if (!module || !lesson) {
    notFound();
  }

  const { authOn, user, demoMode } = await requireCourseAccess(
    `/aulas/${modulo}/${aula}`,
  );

  const [progress, isAdmin] = await Promise.all([
    getUserCourseProgress(user?.id),
    isAdminUser(user),
  ]);

  // Trava por tempo: bloqueia deep-link direto a aula de módulo ainda não
  // liberado. Admin e modo demo passam direto.
  const bypassLock = demoMode || isAdmin;
  if (!bypassLock) {
    const access = computeModuleAccess(user?.created_at, module.unlockAfterDays);
    if (!access.isUnlocked) {
      redirect("/area-de-membros");
    }
  }

  return (
    <AulasShell
      authOn={authOn}
      userEmail={user?.email}
      active="player"
      isAdmin={isAdmin}
    >
      <Suspense fallback={<CourseSkeleton />}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 md:py-8">
          <CourseArea
            course={course}
            demoMode={demoMode}
            moduleId={modulo}
            lessonId={aula}
            completedKeys={progress.completedKeys}
            totalLessons={progress.totalLessons}
          />
        </div>
      </Suspense>
    </AulasShell>
  );
}
