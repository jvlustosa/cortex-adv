import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import {
  listMembersForAdmin,
  resendMemberAccess,
  setMemberBanned,
} from "@/lib/admin/members";

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

type PostBody = { memberId?: string };

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.memberId) {
    return NextResponse.json(
      { error: "memberId é obrigatório." },
      { status: 400 },
    );
  }

  try {
    const result = await resendMemberAccess(body.memberId);
    return NextResponse.json({ ok: true, magicLink: result.magicLink });
  } catch (err) {
    console.error("[api/admin/members POST]", err);
    return NextResponse.json(
      { error: "Erro ao gerar link de acesso." },
      { status: 500 },
    );
  }
}

type PatchBody = { memberId?: string; banned?: boolean };

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.memberId || typeof body.banned !== "boolean") {
    return NextResponse.json(
      { error: "memberId e banned são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await setMemberBanned(body.memberId, body.banned);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/members PATCH]", err);
    return NextResponse.json(
      { error: "Erro ao atualizar membro." },
      { status: 500 },
    );
  }
}
