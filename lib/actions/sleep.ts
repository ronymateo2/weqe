"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSafeTimezone, getDayKey } from "@/lib/utils/timezone";
import type { SleepRecord, SaveSleepInput } from "@/types/domain";

async function getUserTimezone(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("dy_users")
    .select("timezone")
    .eq("id", userId)
    .single();
  return getSafeTimezone(data?.timezone);
}

export async function saveSleepAction(
  input: SaveSleepInput,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const timezone = await getUserTimezone(session.user.id);
    const dayKey = getDayKey(input.loggedAt, timezone);

    const { error } = await supabase.from("dy_sleep").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        day_key: dayKey,
        logged_at: input.loggedAt,
        sleep_hours: input.sleepHours,
        sleep_quality: input.sleepQuality,
      },
      { onConflict: "user_id,day_key" },
    );

    if (error) throw error;

    revalidatePath("/register");
    revalidatePath("/dashboard");
    revalidatePath("/report");

    return { ok: true, message: "Sueno guardado." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el sueno.",
    };
  }
}

export async function hasSleepToday(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    const supabase = getSupabaseAdmin();
    const timezone = await getUserTimezone(session.user.id);
    const todayKey = getDayKey(new Date().toISOString(), timezone);

    const { count } = await supabase
      .from("dy_sleep")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("day_key", todayKey);

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function getTodaySleep(): Promise<SleepRecord | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const supabase = getSupabaseAdmin();
    const timezone = await getUserTimezone(session.user.id);
    const todayKey = getDayKey(new Date().toISOString(), timezone);

    const { data, error } = await supabase
      .from("dy_sleep")
      .select("id, day_key, logged_at, sleep_hours, sleep_quality")
      .eq("user_id", session.user.id)
      .eq("day_key", todayKey)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      dayKey: data.day_key,
      loggedAt: data.logged_at,
      sleepHours: Number(data.sleep_hours),
      sleepQuality: data.sleep_quality as SleepRecord["sleepQuality"],
    };
  } catch {
    return null;
  }
}
