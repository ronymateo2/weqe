"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ObservationEye, SaveOccurrenceInput } from "@/types/domain";

// --- Observation Types (reusable definitions) ---

export type SaveObservationInput = {
  id: string;
  title: string;
  notes: string;
  eye: ObservationEye;
};

export type ObservationTypeWithLastOccurrence = {
  id: string;
  title: string;
  eye: ObservationEye;
  notes: string;
  lastOccurrence: { loggedAt: string; intensity: number } | null;
};

export async function saveObservationAction(input: SaveObservationInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para guardar observaciones.",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dy_clinical_observations").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        title: input.title,
        notes: input.notes,
        eye: input.eye,
      },
      { onConflict: "id" },
    );

    if (error) throw error;

    revalidatePath("/history");
    return { ok: true, message: "Observacion guardada." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la observacion.",
    };
  }
}

export async function getObservationTypesAction(): Promise<{
  ok: boolean;
  types: ObservationTypeWithLastOccurrence[];
  message?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, types: [], message: "Sesion no encontrada." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: types, error: typesError } = await supabase
      .from("dy_clinical_observations")
      .select("id, title, eye, notes")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (typesError) throw typesError;

    if (!types || types.length === 0) {
      return { ok: true, types: [] };
    }

    const typeIds = types.map((t) => t.id as string);

    // Fetch last occurrence for each type in one query
    const { data: occurrences, error: occError } = await supabase
      .from("dy_observation_occurrences")
      .select("observation_id, logged_at, intensity")
      .in("observation_id", typeIds)
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false });

    if (occError) throw occError;

    // Pick only the most recent occurrence per type
    const lastOccurrenceMap = new Map<
      string,
      { loggedAt: string; intensity: number }
    >();
    for (const occ of occurrences ?? []) {
      const obsId = occ.observation_id as string;
      if (!lastOccurrenceMap.has(obsId)) {
        lastOccurrenceMap.set(obsId, {
          loggedAt: occ.logged_at as string,
          intensity: occ.intensity as number,
        });
      }
    }

    const result: ObservationTypeWithLastOccurrence[] = types.map((t) => ({
      id: t.id as string,
      title: (t.title ?? "") as string,
      eye: (t.eye ?? "none") as ObservationEye,
      notes: (t.notes ?? "") as string,
      lastOccurrence: lastOccurrenceMap.get(t.id as string) ?? null,
    }));

    return { ok: true, types: result };
  } catch (error) {
    return {
      ok: false,
      types: [],
      message:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las observaciones.",
    };
  }
}

// --- Occurrences ---

export async function saveOccurrenceAction(input: SaveOccurrenceInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesion para guardar." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dy_observation_occurrences").upsert(
      {
        id: input.id,
        user_id: session.user.id,
        observation_id: input.observationId,
        logged_at: input.loggedAt,
        intensity: input.intensity,
        duration_minutes: input.durationMinutes,
        notes: input.notes || null,
      },
      { onConflict: "id" },
    );

    if (error) throw error;

    revalidatePath("/history");
    return { ok: true, message: "Ocurrencia registrada." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la ocurrencia.",
    };
  }
}

// --- History (Observaciones tab) ---

export type ObservationEntry = {
  kind: "observation";
  id: string;
  observationId: string;
  loggedAt: string;
  title: string;
  notes: string;
  eye: ObservationEye;
  intensity: number;
  durationMinutes: number | null;
};

export async function getObservationsAction(): Promise<{
  ok: boolean;
  observations: ObservationEntry[];
  message?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, observations: [], message: "Sesion no encontrada." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dy_observation_occurrences")
      .select(
        "id, logged_at, intensity, duration_minutes, notes, observation_id, dy_clinical_observations(title, eye)",
      )
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false });

    if (error) throw error;

    const observations: ObservationEntry[] = (data ?? []).map((row) => {
      const type = row.dy_clinical_observations as unknown as {
        title: string;
        eye: string;
      } | null;
      return {
        kind: "observation" as const,
        id: row.id as string,
        observationId: row.observation_id as string,
        loggedAt: row.logged_at as string,
        title: (type?.title ?? "") as string,
        eye: (type?.eye ?? "none") as ObservationEye,
        notes: (row.notes ?? "") as string,
        intensity: row.intensity as number,
        durationMinutes: (row.duration_minutes ?? null) as number | null,
      };
    });

    return { ok: true, observations };
  } catch (error) {
    return {
      ok: false,
      observations: [],
      message:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las observaciones.",
    };
  }
}
