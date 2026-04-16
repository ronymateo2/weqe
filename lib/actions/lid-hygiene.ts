"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSafeTimezone, getDayKey } from "@/lib/utils/timezone";
import type { SaveHygieneInput, HygieneRecord } from "@/types/domain";

async function getUserTimezone(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("dy_users")
    .select("timezone")
    .eq("id", userId)
    .single();
  return getSafeTimezone(data?.timezone);
}

export async function saveLidHygieneAction(
  input: SaveHygieneInput,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const timezone = await getUserTimezone(session.user.id);
    const dayKey = getDayKey(input.loggedAt, timezone);
    const userId = session.user.id;

    // 1. Check before upserting: is this a new session or a calibration update?
    //    Read in parallel: existing raw entry (by id) + existing daily summary
    const [existingRawResult, existingDailyResult] = await Promise.all([
      supabase
        .from("dy_lid_hygiene")
        .select("id")
        .eq("id", input.id)
        .maybeSingle(),
      supabase
        .from("dy_hygiene_daily")
        .select("status, completed_count")
        .eq("user_id", userId)
        .eq("day_key", dayKey)
        .maybeSingle(),
    ]);

    const isNewSession = !existingRawResult.data;

    // 2. Upsert raw event log — preserves offline idempotency
    const { error: rawError } = await supabase.from("dy_lid_hygiene").upsert(
      {
        id: input.id,
        user_id: userId,
        day_key: dayKey,
        logged_at: input.loggedAt,
        status: input.status,
        deviation_value: input.deviationValue,
        friction_type: input.frictionType,
        user_note: input.userNote ?? null,
      },
      { onConflict: "id" },
    );
    if (rawError) throw rawError;
    const existing = existingDailyResult.data;
    const wasCompleted = existing?.status === "completed";
    const isNowCompleted = input.status === "completed";
    const completedDelta =
      (isNowCompleted ? 1 : 0) - (wasCompleted ? 1 : 0);
    // Only increment session count when it's a brand-new completed session
    const currentCount = existing?.completed_count ?? 0;
    const newCompletedCount =
      currentCount + (isNewSession && isNowCompleted ? 1 : 0);

    // 3. Upsert daily summary — latest write wins for the day
    const { error: dailyError } = await supabase
      .from("dy_hygiene_daily")
      .upsert(
        {
          user_id: userId,
          day_key: dayKey,
          status: input.status,
          deviation_value: input.deviationValue,
          friction_type: input.frictionType,
          user_note: input.userNote ?? null,
          last_logged_at: input.loggedAt,
          completed_count: newCompletedCount,
        },
        { onConflict: "user_id,day_key" },
      );
    if (dailyError) throw dailyError;

    // 4. Update per-user stats (first_day_key + total_completed_days)
    const { data: currentStats } = await supabase
      .from("dy_hygiene_stats")
      .select("first_day_key, total_completed_days")
      .eq("user_id", userId)
      .maybeSingle();

    if (!currentStats) {
      // First save ever for this user
      const { error: statsError } = await supabase
        .from("dy_hygiene_stats")
        .insert({
          user_id: userId,
          first_day_key: dayKey,
          total_completed_days: isNowCompleted ? 1 : 0,
        });
      if (statsError) throw statsError;
    } else {
      const newFirstDay =
        dayKey < currentStats.first_day_key
          ? dayKey
          : currentStats.first_day_key;
      const newTotal = Math.max(
        0,
        currentStats.total_completed_days + completedDelta,
      );
      const { error: statsError } = await supabase
        .from("dy_hygiene_stats")
        .update({
          first_day_key: newFirstDay,
          total_completed_days: newTotal,
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (statsError) throw statsError;
    }

    revalidatePath("/register");
    revalidatePath("/history");
    revalidatePath("/dashboard");

    return { ok: true, message: "Higiene guardada." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la higiene.",
    };
  }
}

export async function getLidHygieneHistoryAction(
  weeks: number = 9,
): Promise<HygieneRecord[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const supabase = getSupabaseAdmin();
    const timezone = getSafeTimezone(session.user.timezone);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffKey = getDayKey(cutoff.toISOString(), timezone);

    // One row per day — no deduplication needed
    const { data, error } = await supabase
      .from("dy_hygiene_daily")
      .select(
        "day_key, last_logged_at, status, deviation_value, friction_type, user_note, completed_count",
      )
      .eq("user_id", session.user.id)
      .gte("day_key", cutoffKey)
      .order("day_key", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.day_key,
      dayKey: row.day_key,
      loggedAt: row.last_logged_at,
      status: row.status as HygieneRecord["status"],
      deviationValue: row.deviation_value,
      frictionType: row.friction_type as HygieneRecord["frictionType"],
      userNote: row.user_note,
      completedCount: row.completed_count,
    }));
  } catch {
    return [];
  }
}

export async function getLidHygieneDashboardAction(): Promise<{
  firstDayKey: string | null;
  totalCompletedDays: number;
  recentRecords: HygieneRecord[];
  todayCompletedCount: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { firstDayKey: null, totalCompletedDays: 0, recentRecords: [], todayCompletedCount: 0 };
  }

  try {
    const supabase = getSupabaseAdmin();

    // O(1) stats lookup — one row per user
    const { data: stats } = await supabase
      .from("dy_hygiene_stats")
      .select("first_day_key, total_completed_days")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!stats) {
      return { firstDayKey: null, totalCompletedDays: 0, recentRecords: [], todayCompletedCount: 0 };
    }

    const firstDayKey: string = stats.first_day_key;
    const totalCompletedDays: number = stats.total_completed_days;

    // Compute current cycle start (same O(1) math as the component)
    const msPerDay = 24 * 60 * 60 * 1000;
    const today = new Date().toLocaleDateString("en-CA");
    const firstDate = new Date(firstDayKey + "T00:00:00Z");
    const todayDate = new Date(today + "T00:00:00Z");
    const daysSinceFirst = Math.round(
      (todayDate.getTime() - firstDate.getTime()) / msPerDay,
    );
    const cycle = Math.floor(daysSinceFirst / 21) + 1;
    const cycleStartDate = new Date(firstDate);
    cycleStartDate.setUTCDate(firstDate.getUTCDate() + (cycle - 1) * 21);
    const cycleStartKey = cycleStartDate.toISOString().slice(0, 10);

    // At most 21 rows (cycle records) + today's raw session count — run in parallel
    const [cycleResult, todayCountResult] = await Promise.all([
      supabase
        .from("dy_hygiene_daily")
        .select(
          "day_key, last_logged_at, status, deviation_value, friction_type, user_note, completed_count",
        )
        .eq("user_id", session.user.id)
        .gte("day_key", cycleStartKey)
        .order("day_key", { ascending: false }),
      supabase
        .from("dy_lid_hygiene")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("day_key", today)
        .eq("status", "completed"),
    ]);

    if (cycleResult.error) throw cycleResult.error;

    const recentRecords = (cycleResult.data ?? []).map((row) => ({
      id: row.day_key,
      dayKey: row.day_key,
      loggedAt: row.last_logged_at,
      status: row.status as HygieneRecord["status"],
      deviationValue: row.deviation_value,
      frictionType: row.friction_type as HygieneRecord["frictionType"],
      userNote: row.user_note,
      completedCount: row.completed_count,
    }));

    const todayCompletedCount = todayCountResult.count ?? 0;

    return { firstDayKey, totalCompletedDays, recentRecords, todayCompletedCount };
  } catch {
    return { firstDayKey: null, totalCompletedDays: 0, recentRecords: [], todayCompletedCount: 0 };
  }
}

// Fetches individual sessions from the raw event log for ServoView.
// Returns one record per session (multiple per day possible), ordered chronologically.
export async function getLidHygieneSessionsAction(
  weeks: number = 3,
): Promise<HygieneRecord[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const supabase = getSupabaseAdmin();
    const timezone = getSafeTimezone(session.user.timezone);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffKey = getDayKey(cutoff.toISOString(), timezone);

    const { data, error } = await supabase
      .from("dy_lid_hygiene")
      .select(
        "id, day_key, logged_at, status, deviation_value, friction_type, user_note",
      )
      .eq("user_id", session.user.id)
      .eq("status", "completed")
      .gte("day_key", cutoffKey)
      .order("logged_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      dayKey: row.day_key,
      loggedAt: row.logged_at,
      status: row.status as HygieneRecord["status"],
      deviationValue: row.deviation_value,
      frictionType: row.friction_type as HygieneRecord["frictionType"],
      userNote: row.user_note,
      completedCount: 1,
    }));
  } catch {
    return [];
  }
}
