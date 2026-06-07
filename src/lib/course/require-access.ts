import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

export async function requireCourseAccess(nextPath: string) {
  if (isDemoMode()) {
    return { authOn: false, user: null, demoMode: true as const };
  }

  const authOn = isSupabaseEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { authOn, user, demoMode: false as const };
}
