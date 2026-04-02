"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type SaveSymptomInput = {
  id: string;
  loggedAt: string;
  symptomType: string;
  notes?: string;
};

export async function saveSymptomAction(input: SaveSymptomInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar sintomas." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dy_symptoms").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        logged_at: input.loggedAt,
        symptom_type: input.symptomType,
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

    return { ok: true, message: "Sintoma guardado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el sintoma."
    };
  }
}
