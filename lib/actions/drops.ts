"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DropEye } from "@/types/domain";

export type SaveDropInput = {
  id: string;
  loggedAt: string;
  name: string;
  quantity: number;
  eye: DropEye;
  notes?: string;
};

export async function saveDropAction(input: SaveDropInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar gotas." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const normalizedName = input.name.trim().toLowerCase();
    const { data: dropType, error: dropTypeError } = await supabase
      .from("dy_drop_types")
      .upsert(
        {
          user_id: session.user.id,
          name: normalizedName
        },
        {
          onConflict: "user_id,name",
          ignoreDuplicates: false
        }
      )
      .select("id")
      .single();

    if (dropTypeError || !dropType) {
      throw dropTypeError ?? new Error("No se pudo crear el tipo de gota.");
    }

    const { error } = await supabase.from("dy_drops").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        drop_type_id: dropType.id,
        logged_at: input.loggedAt,
        quantity: input.quantity,
        eye: input.eye,
        notes: input.notes ?? null
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }

    revalidatePath("/history");
    revalidatePath("/register");

    return { ok: true, message: "Gota registrada." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo guardar la gota."
    };
  }
}
