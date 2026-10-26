import { CourseMaterialsArea } from "@/components/members/course-materials-area";
import { requireCourseAccess } from "@/lib/course/require-access";
import { loadPublishedMaterials } from "@/lib/materials/storage";

export const metadata = {
  title: "Materiais Didáticos | Claude Cowork para advogados",
  description:
    "As apostilas em PDF do curso, com o resumo de cada uma, para alunos da Claude Academy.",
  openGraph: {
    images: [{ url: "/og/membros.png", width: 1200, height: 630 }],
  },
};

export default async function MateriaisDidaticosPage() {
  await requireCourseAccess("/area-de-membros/materiais");
  // Só apostila com PDF no bucket: cadastro que ainda espera o upload no
  // /admin não aparece.
  const materials = await loadPublishedMaterials();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <CourseMaterialsArea materials={materials} />
    </main>
  );
}
