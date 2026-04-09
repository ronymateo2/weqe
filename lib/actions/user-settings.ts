"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSafeTimezone, DEFAULT_TIMEZONE } from "@/lib/utils/timezone";

export async function getUserTimezoneAction(): Promise<
  { ok: true; timezone: string } | { ok: false; message: string; timezone: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Sesión requerida.", timezone: DEFAULT_TIMEZONE };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dy_users")
      .select("timezone")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) throw error;

    return { ok: true, timezone: getSafeTimezone(data?.timezone) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al obtener zona horaria.";
    return { ok: false, message: msg, timezone: DEFAULT_TIMEZONE };
  }
}

export async function updateTimezoneAction(
  timezone: string
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Sesión requerida." };
  }

  const safe = getSafeTimezone(timezone);
  if (safe !== timezone) {
    return { ok: false, message: "Zona horaria inválida." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("dy_users")
      .update({ timezone })
      .eq("id", session.user.id);

    if (error) throw error;

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/report");

    return { ok: true, message: "Zona horaria actualizada." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al actualizar zona horaria.";
    return { ok: false, message: msg };
  }
}
