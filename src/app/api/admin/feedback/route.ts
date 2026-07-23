import { NextResponse } from "next/server";
import { adminJson } from "@/lib/admin/api-response";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { listRecentFeedback } from "@/lib/lessons/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const feedback = await listRecentFeedback();
    return adminJson({ feedback });
  } catch (err) {
    console.error("[api/admin/feedback]", err);
    return NextResponse.json({ error: "Erro ao carregar feedback." }, { status: 500 });
  }
}
