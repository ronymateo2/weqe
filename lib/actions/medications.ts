"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MedicationRecord, SaveMedicationInput } from "@/types/domain";

export async function getMedicationsAction(): Promise<
  { ok: true; medications: MedicationRecord[] } | { ok: false; message: string; medications: [] }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesión para ver tus medicamentos.", medications: [] };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dy_medications")
      .select("id, name, dosage, frequency, notes, sort_order")
      .eq("user_id", session.user.id)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    return { ok: true, medications: (data ?? []) as MedicationRecord[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al cargar medicamentos.";
    return { ok: false, message: msg, medications: [] };
  }
}

export async function saveMedicationAction(
  input: SaveMedicationInput
): Promise<{ ok: boolean; message: string; medication?: MedicationRecord }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesión." };
  }

  const name = input.name.trim();
  if (!name) return { ok: false, message: "El nombre del medicamento es obligatorio." };

  try {
    const supabase = getSupabaseAdmin();

    const record = {
      ...(input.id ? { id: input.id } : {}),
      user_id: session.user.id,
      name,
      dosage: input.dosage?.trim() || null,
      frequency: input.frequency?.trim() || null,
      notes: input.notes?.trim() || null
    };

    const { data, error } = await supabase
      .from("dy_medications")
      .upsert(record, { onConflict: "id", ignoreDuplicates: false })
      .select("id, name, dosage, frequency, notes, sort_order")
      .single();

    if (error || !data) throw error ?? new Error("No se pudo guardar el medicamento.");

    revalidatePath("/profile");
    return { ok: true, message: "Medicamento guardado.", medication: data as MedicationRecord };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al guardar el medicamento.";
    return { ok: false, message: msg };
  }
}

export async function deleteMedicationAction(
  id: string
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesión." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("dy_medications")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/profile");
    return { ok: true, message: "Medicamento eliminado." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al eliminar el medicamento.";
    return { ok: false, message: msg };
  }
}

export async function reorderMedicationsAction(
  input: { ids: string[] }
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    const supabase = getSupabaseAdmin();
    await Promise.all(
      input.ids.map((id, index) =>
        supabase
          .from("dy_medications")
          .update({ sort_order: index })
          .eq("id", id)
          .eq("user_id", session.user.id)
      )
    );
  } catch {
    // Fire-and-forget: order will resync on next page load
  }
}
