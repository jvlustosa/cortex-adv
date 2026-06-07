import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL_DOMAIN, hasAdminEmailDomain } from "@/lib/admin/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

export { ADMIN_EMAIL_DOMAIN, hasAdminEmailDomain };

export async function isAdminUser(
  user: { email?: string | null; app_metadata?: Record<string, unknown> } | null,
): Promise<boolean> {
  if (!user?.email || !hasAdminEmailDomain(user.email)) {
    return false;
  }

  const email = user.email.trim().toLowerCase();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[admin] falha ao verificar admin_users:", error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("[admin] erro ao verificar admin:", err);
    return false;
  }
}

export async function requireAdmin(nextPath = "/admin") {
  if (!isSupabaseEnabled()) {
    redirect("/login?next=" + encodeURIComponent(nextPath));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!(await isAdminUser(user))) {
    redirect("/area-de-membros");
  }

  return { user };
}

export async function assertAdminApi() {
  if (!isSupabaseEnabled()) {
    return {
      error: NextResponse.json({ error: "Supabase desativado." }, { status: 503 }),
    } as const;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user))) {
    return {
      error: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    } as const;
  }

  return { user } as const;
}
