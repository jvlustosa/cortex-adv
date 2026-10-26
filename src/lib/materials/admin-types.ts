/** Linha da aba "Materiais Didáticos" do /admin (GET /api/admin/materials). */
export type MaterialAdminRow = {
  id: string;
  title: string;
  volume: string;
  categoryTitle: string;
  exclusive: boolean;
  filePath: string;
  /** null = ainda sem PDF no bucket (não aparece para o aluno). */
  stored: { size: number; updatedAt: string | null } | null;
};
