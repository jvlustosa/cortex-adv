import { AulasShell } from "@/components/aulas/aulas-shell";
import { isAdminUser } from "@/lib/admin/require-admin";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

// Chrome compartilhado da área de membros (header + footer). Fica no layout —
// e não em cada page — para persistir entre navegações: catálogo, galeria e
// player trocam só o conteúdo, sem remontar o header.
//
// A gate de acesso continua em cada page (requireCourseAccess), que redireciona
// com o `next` correto por rota. Aqui só lemos o usuário para popular o header;
// se não houver sessão, o redirect da page assume antes de qualquer render.
export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = isDemoMode();

  let userEmail: string | null = null;
  let authOn = false;
  let user: { email?: string | null } | null = null;

  if (!demoMode) {
    authOn = isSupabaseEnabled();
    if (authOn) {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
      userEmail = authUser?.email ?? null;
    }
  }

  const isAdmin = await isAdminUser(user);

  return (
    <AulasShell authOn={authOn} userEmail={userEmail} isAdmin={isAdmin}>
      {children}
    </AulasShell>
  );
}
