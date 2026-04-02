"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TimeOfDay, SleepQuality } from "@/types/domain";

export type SaveCheckInInput = {
  id: string;
  loggedAt: string;
  timeOfDay: TimeOfDay;
  eyelidPain: number;
  templePain: number;
  masseterPain: number;
  cervicalPain: number;
  orbitalPain: number;
  overallPain: number;
  stressLevel: number;
  sleepHours?: number | null;
  sleepQuality?: SleepQuality | null;
  notes?: string;
};

export async function saveCheckInAction(input: SaveCheckInInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dy_check_ins").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        logged_at: input.loggedAt,
        time_of_day: input.timeOfDay,
        eyelid_pain: input.eyelidPain,
        temple_pain: input.templePain,
        masseter_pain: input.masseterPain,
        cervical_pain: input.cervicalPain,
        orbital_pain: input.orbitalPain,
        overall_pain: input.overallPain,
        stress_level: input.stressLevel,
        sleep_hours: input.sleepHours ?? null,
        sleep_quality: input.sleepQuality ?? null,
        notes: input.notes ?? null
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }

    revalidatePath("/register");
    revalidatePath("/history");
    revalidatePath("/dashboard");
    revalidatePath("/report");

    return { ok: true, message: "Registro guardado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el registro."
    };
  }
}
