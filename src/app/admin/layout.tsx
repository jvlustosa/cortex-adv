import { AulasShell } from "@/components/aulas/aulas-shell";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin("/admin");

  return (
    <AulasShell
      authOn={isSupabaseEnabled()}
      userEmail={user.email ?? null}
      isAdmin
    >
      {children}
    </AulasShell>
  );
}
