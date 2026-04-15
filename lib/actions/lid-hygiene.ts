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

    const { error } = await supabase.from("dy_lid_hygiene").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        day_key: dayKey,
        logged_at: input.loggedAt,
        status: input.status,
        deviation_value: input.deviationValue,
        friction_type: input.frictionType,
        user_note: input.userNote ?? null,
      },
      { onConflict: "id" },
    );

    if (error) throw error;

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

    const { data, error } = await supabase
      .from("dy_lid_hygiene")
      .select(
        "id, day_key, logged_at, status, deviation_value, friction_type, user_note",
      )
      .eq("user_id", session.user.id)
      .gte("day_key", cutoffKey)
      .order("logged_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      dayKey: row.day_key,
      loggedAt: row.logged_at,
      status: row.status as HygieneRecord["status"],
      deviationValue: row.deviation_value,
      frictionType: row.friction_type as HygieneRecord["frictionType"],
      userNote: row.user_note,
    }));
  } catch {
    return [];
  }
}
