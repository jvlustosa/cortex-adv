import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isDbCourseSource } from "@/lib/supabase/enabled";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Painel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <AdminDashboard dbMode={isDbCourseSource()} />
    </main>
  );
}
