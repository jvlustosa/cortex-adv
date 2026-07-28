import { PacksArea } from "@/components/members/packs-area";
import { computePackAccess, type PackAccess } from "@/lib/course/packs-access";
import { requireCourseAccess } from "@/lib/course/require-access";
import { loadPacks } from "@/lib/packs/load-packs";

export const metadata = {
  title: "Galeria Premium | Claude Cowork para advogados",
  description:
    "Skills, conectores e itens premium do curso, exclusivos de alunos da Claude Academy.",
  openGraph: {
    images: [{ url: "/og/membros.png", width: 1200, height: 630 }],
  },
};

export default async function PacksPage() {
  const { user, demoMode } = await requireCourseAccess(
    "/area-de-membros/packs",
  );

  // Em modo demo (localhost, sem auth) liberamos para prévia. Com auth, a trava
  // por data vale — sem created_at confiável, fica bloqueado.
  const access: PackAccess = demoMode
    ? { isUnlocked: true, unlockAt: null }
    : computePackAccess(user?.created_at);

  const packs = await loadPacks();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <PacksArea packs={packs} access={access} />
    </main>
  );
}
