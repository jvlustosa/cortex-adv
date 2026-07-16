import Link from "next/link";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isSupabaseEnabled, isDbCourseSource } from "@/lib/supabase/enabled";

export const metadata = {
  title: "Admin | Painel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin("/admin");
  const authOn = isSupabaseEnabled();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <ClaudeAcademyBrand size="sm" />
          <nav className="flex items-center gap-3">
            <Link
              href="/area-de-membros"
              className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Catálogo            </Link>
            {authOn ? <SignOutButton /> : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <AdminDashboard dbMode={isDbCourseSource()} />
      </main>
    </div>
  );
}
