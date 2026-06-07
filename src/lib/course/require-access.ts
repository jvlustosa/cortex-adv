import { redirect } from "next/navigation";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

export async function requireCourseAccess(nextPath: string) {
  const authOn = isSupabaseEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (authOn && !user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { authOn, user };
}
