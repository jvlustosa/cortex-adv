import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

// Confirma links de e-mail (magic link, recuperação, convite) no padrão SSR:
// verifyOtp grava a sessão em COOKIE, então os Server Components enxergam o
// usuário. Substitui o fluxo implicit (#access_token no hash), que só vivia no
// localStorage do browser e era invisível pro servidor.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (!isSupabaseEnabled()) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
