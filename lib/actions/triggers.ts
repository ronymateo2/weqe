"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TriggerType } from "@/types/domain";

export type SaveTriggerInput = {
  id: string;
  loggedAt: string;
  triggerType: TriggerType;
  intensity: 1 | 2 | 3;
  notes?: string;
};

export async function saveTriggerAction(input: SaveTriggerInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar triggers." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dy_triggers").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        logged_at: input.loggedAt,
        trigger_type: input.triggerType,
        intensity: input.intensity,
        notes: input.notes ?? null
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }

    revalidatePath("/history");
    revalidatePath("/register");
    revalidatePath("/dashboard");

    return { ok: true, message: "Trigger guardado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el trigger."
    };
  }
}
