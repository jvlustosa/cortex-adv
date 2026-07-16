import { grantMemberAccess, type GrantAccessResult } from "@/lib/access/grant";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMergedCourse } from "@/lib/lessons/merge-course";

export type MemberAdminRow = {
  id: string;
  email: string;
  createdAt: string;
  lastActiveAt: string | null;
  uniqueLessonsViewed: number;
  totalViews: number;
  progressPercent: number;
  feedbackCount: number;
  avgRatingGiven: number | null;
  banned: boolean;
};

/** Banimento efetivamente permanente (~100 anos). Reversível via "none". */
const BAN_DURATION = "876000h";

function isBanned(bannedUntil?: string | null): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil).getTime() > Date.now();
}

export type MemberTotals = {
  members: number;
  activeLast7Days: number;
  avgProgressPercent: number;
  totalViews: number;
};

async function countCourseLessons(): Promise<number> {
  const course = await getMergedCourse();
  return course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}

export async function listMembersForAdmin(): Promise<{
  members: MemberAdminRow[];
  totals: MemberTotals;
}> {
  const admin = createAdminClient();
  const totalLessons = await countCourseLessons();

  const users: {
    id: string;
    email?: string;
    created_at?: string;
    banned_until?: string | null;
  }[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;

    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        banned_until: (u as { banned_until?: string | null }).banned_until,
      })),
    );

    if (data.users.length < 100) break;
    page += 1;
  }

  const { data: views, error: viewsErr } = await admin
    .from("lesson_views")
    .select("user_id, module_id, lesson_id, viewed_at");
  if (viewsErr) throw viewsErr;

  const { data: feedbacks, error: feedbackErr } = await admin
    .from("lesson_feedback")
    .select("user_id, rating");
  if (feedbackErr) throw feedbackErr;

  type ViewRow = {
    user_id: string | null;
    module_id: string;
    lesson_id: string;
    viewed_at: string;
  };

  type FeedbackRow = { user_id: string | null; rating: number };

  const viewsByUser = new Map<
    string,
    { uniqueLessons: Set<string>; totalViews: number; lastActiveAt: string | null }
  >();
  const feedbackByUser = new Map<string, { sum: number; count: number }>();

  for (const row of (views ?? []) as ViewRow[]) {
    if (!row.user_id) continue;
    const prev = viewsByUser.get(row.user_id) ?? {
      uniqueLessons: new Set<string>(),
      totalViews: 0,
      lastActiveAt: null,
    };
    prev.uniqueLessons.add(`${row.module_id}:${row.lesson_id}`);
    prev.totalViews += 1;
    if (!prev.lastActiveAt || row.viewed_at > prev.lastActiveAt) {
      prev.lastActiveAt = row.viewed_at;
    }
    viewsByUser.set(row.user_id, prev);
  }

  for (const row of (feedbacks ?? []) as FeedbackRow[]) {
    if (!row.user_id) continue;
    const prev = feedbackByUser.get(row.user_id) ?? { sum: 0, count: 0 };
    feedbackByUser.set(row.user_id, {
      sum: prev.sum + row.rating,
      count: prev.count + 1,
    });
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let activeLast7Days = 0;
  let progressSum = 0;
  let totalViewsAll = 0;

  const members: MemberAdminRow[] = users
    .filter((u) => u.email)
    .map((user) => {
      const usage = viewsByUser.get(user.id);
      const feedback = feedbackByUser.get(user.id);
      const uniqueLessonsViewed = usage?.uniqueLessons.size ?? 0;
      const totalViews = usage?.totalViews ?? 0;
      const progressPercent =
        totalLessons > 0
          ? Math.round((uniqueLessonsViewed / totalLessons) * 100)
          : 0;

      if (usage?.lastActiveAt) {
        const last = new Date(usage.lastActiveAt).getTime();
        if (last >= sevenDaysAgo) activeLast7Days += 1;
      }

      progressSum += progressPercent;
      totalViewsAll += totalViews;

      return {
        id: user.id,
        email: user.email!,
        createdAt: user.created_at ?? new Date(0).toISOString(),
        lastActiveAt: usage?.lastActiveAt ?? null,
        uniqueLessonsViewed,
        totalViews,
        progressPercent,
        feedbackCount: feedback?.count ?? 0,
        avgRatingGiven:
          feedback && feedback.count > 0
            ? Math.round((feedback.sum / feedback.count) * 10) / 10
            : null,
        banned: isBanned(user.banned_until),
      };
    })
    .sort((a, b) => {
      const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return bTime - aTime;
    });

  return {
    members,
    totals: {
      members: members.length,
      activeLast7Days,
      avgProgressPercent:
        members.length > 0 ? Math.round(progressSum / members.length) : 0,
      totalViews: totalViewsAll,
    },
  };
}

/**
 * Gera um novo link de acesso (magic link) para um membro existente, para o
 * admin reenviar pelo canal que preferir. Reaproveita o fluxo idempotente de
 * grantMemberAccess — resolve o e-mail pelo id para não confiar no cliente.
 */
export async function resendMemberAccess(
  memberId: string,
): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(memberId);
  if (error || !data.user?.email) {
    throw new Error(error?.message ?? "Membro não encontrado.");
  }
  return grantMemberAccess(data.user.email);
}

/**
 * Bane (bloqueia login) ou desbane um membro. Banimento é reversível: mantém
 * conta, progresso e feedback; apenas impede novos logins até desbanir.
 */
export async function setMemberBanned(
  memberId: string,
  banned: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(memberId, {
    ban_duration: banned ? BAN_DURATION : "none",
  });
  if (error) throw new Error(error.message);
}
