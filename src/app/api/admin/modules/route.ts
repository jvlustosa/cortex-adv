import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { isDbCourseSource } from "@/lib/supabase/enabled";
import {
  listModulesForAdmin,
  createModule,
  updateModule,
  deleteModule,
} from "@/lib/lessons/repository-db";

// Gestão de seções (módulos) só faz sentido com o curso no DB. Fora do modo DB,
// os módulos vêm do course.yml e não são editáveis pelo painel.
function dbModeGuard() {
  if (!isDbCourseSource()) {
    return NextResponse.json(
      { error: "Gestão de seções requer COURSE_SOURCE=db (curso no banco)." },
      { status: 409 },
    );
  }
  return null;
}

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;
  const guard = dbModeGuard();
  if (guard) return guard;

  try {
    const modules = await listModulesForAdmin();
    return NextResponse.json({ modules });
  } catch (err) {
    console.error("[api/admin/modules GET]", err);
    return NextResponse.json({ error: "Erro ao carregar seções." }, { status: 500 });
  }
}

type PostBody = {
  title?: string;
  description?: string | null;
  thumbnailGradient?: string | null;
  coverImage?: string | null;
  unlockAfterDays?: number | null;
  published?: boolean;
  comingSoon?: boolean;
};

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;
  const guard = dbModeGuard();
  if (guard) return guard;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title é obrigatório." }, { status: 400 });
  }

  try {
    const section = await createModule({
      title: body.title.trim(),
      description: body.description ?? null,
      thumbnailGradient: body.thumbnailGradient ?? null,
      coverImage: body.coverImage ?? null,
      unlockAfterDays: body.unlockAfterDays ?? 0,
      published: body.published ?? true,
      comingSoon: body.comingSoon ?? false,
    });
    return NextResponse.json({ ok: true, module: section });
  } catch (err) {
    console.error("[api/admin/modules POST]", err);
    return NextResponse.json({ error: "Erro ao criar seção." }, { status: 500 });
  }
}

type PatchBody = {
  moduleId?: string;
  title?: string;
  description?: string | null;
  thumbnailGradient?: string | null;
  coverImage?: string | null;
  unlockAfterDays?: number | null;
  published?: boolean;
  comingSoon?: boolean;
};

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;
  const guard = dbModeGuard();
  if (guard) return guard;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId) {
    return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
  }

  try {
    await updateModule(body.moduleId, {
      title: body.title,
      description: body.description,
      thumbnailGradient: body.thumbnailGradient,
      coverImage: body.coverImage,
      unlockAfterDays: body.unlockAfterDays,
      published: body.published,
      comingSoon: body.comingSoon,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/modules PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar seção." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;
  const guard = dbModeGuard();
  if (guard) return guard;

  let body: { moduleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId) {
    return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
  }

  try {
    await deleteModule(body.moduleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/modules DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir seção." }, { status: 500 });
  }
}
