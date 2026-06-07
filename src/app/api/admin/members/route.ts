import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { listMembersForAdmin } from "@/lib/admin/members";

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const data = await listMembersForAdmin();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/admin/members GET]", err);
    return NextResponse.json(
      { error: "Erro ao carregar membros." },
      { status: 500 },
    );
  }
}
