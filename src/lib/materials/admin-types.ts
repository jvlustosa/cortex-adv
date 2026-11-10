import type { MaterialCategoryId } from "@/data/materiais";

/** Linha da aba "Materiais Didáticos" do /admin (GET /api/admin/materials). */
export type MaterialAdminRow = {
  id: string;
  title: string;
  volume: string;
  description: string;
  topics: string[];
  pages: number;
  category: MaterialCategoryId;
  categoryTitle: string;
  exclusive: boolean;
  filePath: string;
  /** Endereço da capa para <img>; null = sem capa. */
  coverSrc: string | null;
  /** null = ainda sem PDF no bucket (não aparece para o aluno). */
  stored: { size: number; updatedAt: string | null } | null;
};

export type MaterialCategoryOption = { id: MaterialCategoryId; title: string };
