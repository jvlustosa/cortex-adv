import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AulasShell } from "@/components/aulas/aulas-shell";
import { CourseArea } from "@/components/members/course-area";
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

  const { authOn, user } = await requireCourseAccess(`/aulas/${modulo}/${aula}`);

  return (
    <AulasShell authOn={authOn} userEmail={user?.email} active="player">
      <Suspense fallback={<CourseSkeleton />}>
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 md:py-8">
          <CourseArea
            course={course}
            userEmail={user?.email}
            demoMode={!authOn || !user}
            moduleId={modulo}
            lessonId={aula}
          />
        </div>
      </Suspense>
    </AulasShell>
  );
}
