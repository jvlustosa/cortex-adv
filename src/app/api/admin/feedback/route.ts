import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { listRecentFeedback } from "@/lib/lessons/repository";

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const feedback = await listRecentFeedback();
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("[api/admin/feedback]", err);
    return NextResponse.json({ error: "Erro ao carregar feedback." }, { status: 500 });
  }
}
