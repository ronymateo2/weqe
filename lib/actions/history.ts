"use server";

import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getSafeTimezone,
  getDayKey,
  dayKeyToUtcStart,
  DEFAULT_TIMEZONE,
} from "@/lib/utils/timezone";
import type { DropEye, TriggerType, ObservationEye } from "@/types/domain";

type HistoryCheckInEntry = {
  id: string;
  kind: "check_in";
  loggedAt: string;
  eyelidPain: number;
  templePain: number;
  masseterPain: number;
  cervicalPain: number;
  orbitalPain: number;
  triggerType: TriggerType | null;
  notes: string | null;
};

type HistoryDropEntry = {
  id: string;
  kind: "drop";
  loggedAt: string;
  name: string;
  quantity: number;
  eye: DropEye;
};

type HistoryTriggerEntry = {
  id: string;
  kind: "trigger";
  loggedAt: string;
  triggerType: TriggerType;
  intensity: 1 | 2 | 3;
};

type HistorySymptomEntry = {
  id: string;
  kind: "symptom";
  loggedAt: string;
  symptomType: string;
};

export type HistoryObservationEntry = {
  id: string;
  kind: "observation";
  loggedAt: string;
  title: string;
  notes: string;
  eye: ObservationEye;
  intensity: number;
  durationMinutes: number | null;
};

export type HistorySleepEntry = {
  id: string;
  kind: "sleep";
  loggedAt: string;
  sleepHours: number;
  sleepQuality: "muy_malo" | "malo" | "regular" | "bueno" | "excelente";
};

export type HistoryEntry =
  | HistoryCheckInEntry
  | HistoryDropEntry
  | HistoryTriggerEntry
  | HistorySymptomEntry
  | HistoryObservationEntry
  | HistorySleepEntry;

export type HistoryDayGroup = {
  dayKey: string;
  entries: HistoryEntry[];
};

type GetHistoryFeedSuccess = {
  ok: true;
  timezone: string;
  groups: HistoryDayGroup[];
  hasMore: boolean;
};

type GetHistoryFeedError = {
  ok: false;
  message: string;
  timezone: string;
  groups: [];
  hasMore: false;
};

export type GetHistoryFeedResult = GetHistoryFeedSuccess | GetHistoryFeedError;

export async function getHistoryFeedAction(): Promise<GetHistoryFeedResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para ver el historial.",
      timezone: DEFAULT_TIMEZONE,
      groups: [],
      hasMore: false,
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const timezone = getSafeTimezone(session.user.timezone);

    const yesterdayIso = new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const yesterdayDayKey = getDayKey(yesterdayIso, timezone);
    const utcWindowStart = dayKeyToUtcStart(yesterdayDayKey, timezone);

    const [
      checkInsResponse,
      dropsResponse,
      triggersResponse,
      symptomsResponse,
      observationsResponse,
      sleepResponse,
      olderCheckIns,
      olderObservations,
    ] = await Promise.all([
      supabase
        .from("dy_check_ins")
        .select(
          "id, logged_at, eyelid_pain, temple_pain, masseter_pain, cervical_pain, orbital_pain, trigger_type, notes",
        )
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_drops")
        .select(
          `
          id,
          logged_at,
          quantity,
          eye,
          drop_type:dy_drop_types (
            name
          )
        `,
        )
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_triggers")
        .select("id, logged_at, trigger_type, intensity")
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_symptoms")
        .select("id, logged_at, symptom_type")
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_observation_occurrences")
        .select(
          "id, logged_at, intensity, duration_minutes, notes, dy_clinical_observations(title, eye)",
        )
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_sleep")
        .select("id, logged_at, sleep_hours, sleep_quality")
        .eq("user_id", session.user.id)
        .gte("logged_at", utcWindowStart)
        .order("logged_at", { ascending: false }),
      supabase
        .from("dy_check_ins")
        .select("id")
        .eq("user_id", session.user.id)
        .lt("logged_at", utcWindowStart)
        .limit(1),
      supabase
        .from("dy_observation_occurrences")
        .select("id")
        .eq("user_id", session.user.id)
        .lt("logged_at", utcWindowStart)
        .limit(1),
    ]);

    if (checkInsResponse.error) throw checkInsResponse.error;
    if (dropsResponse.error) throw dropsResponse.error;
    if (triggersResponse.error) throw triggersResponse.error;
    if (symptomsResponse.error) throw symptomsResponse.error;
    if (observationsResponse.error) throw observationsResponse.error;


    // Deduplicate sleep by local day — migration used UTC day_key so migrated
    // records may have a different day_key than a fresh record logged the same
    // calendar-day in the user's timezone. Keep the most-recent per local day.
    const sleepByDay = new Map<string, HistorySleepEntry>();
    for (const s of sleepResponse.data ?? []) {
      const localDay = getDayKey(s.logged_at, timezone);
      if (!sleepByDay.has(localDay)) {
        sleepByDay.set(localDay, {
          id: s.id,
          kind: "sleep",
          loggedAt: s.logged_at,
          sleepHours: s.sleep_hours,
          sleepQuality: s.sleep_quality as HistorySleepEntry["sleepQuality"],
        });
      }
    }
    const sleepEntries: HistoryEntry[] = Array.from(sleepByDay.values());

    const checkInEntries: HistoryEntry[] = (checkInsResponse.data ?? []).map(
      (checkIn) => ({
        id: checkIn.id,
        kind: "check_in",
        loggedAt: checkIn.logged_at,
        eyelidPain: checkIn.eyelid_pain,
        templePain: checkIn.temple_pain,
        masseterPain: checkIn.masseter_pain,
        cervicalPain: checkIn.cervical_pain,
        orbitalPain: checkIn.orbital_pain,

        triggerType: (checkIn.trigger_type as TriggerType) ?? null,
        notes: checkIn.notes ?? null,
      }),
    );

    const dropEntries: HistoryEntry[] = (dropsResponse.data ?? []).map(
      (drop) => {
        const dropType = Array.isArray(drop.drop_type)
          ? drop.drop_type[0]
          : drop.drop_type;

        return {
          id: drop.id,
          kind: "drop",
          loggedAt: drop.logged_at,
          quantity: drop.quantity,
          eye: drop.eye as DropEye,
          name: dropType?.name ?? "Gota",
        };
      },
    );

    const triggerEntries: HistoryEntry[] = (triggersResponse.data ?? []).map(
      (trigger) => ({
        id: trigger.id,
        kind: "trigger",
        loggedAt: trigger.logged_at,
        triggerType: trigger.trigger_type as TriggerType,
        intensity: trigger.intensity as 1 | 2 | 3,
      }),
    );

    const symptomEntries: HistoryEntry[] = (symptomsResponse.data ?? []).map(
      (symptom) => ({
        id: symptom.id,
        kind: "symptom",
        loggedAt: symptom.logged_at,
        symptomType: symptom.symptom_type,
      }),
    );

    const observationEntries: HistoryEntry[] = (
      observationsResponse.data ?? []
    ).map((occ) => {
      const type = occ.dy_clinical_observations as unknown as {
        title: string;
        eye: string;
      } | null;
      return {
        id: occ.id,
        kind: "observation",
        loggedAt: occ.logged_at,
        title: (type?.title ?? "") as string,
        eye: (type?.eye ?? "none") as ObservationEye,
        notes: (occ.notes ?? "") as string,
        intensity: occ.intensity as number,
        durationMinutes: (occ.duration_minutes ?? null) as number | null,
      };
    });

    const allEntries = [
      ...checkInEntries,
      ...dropEntries,
      ...triggerEntries,
      ...symptomEntries,
      ...observationEntries,
      ...sleepEntries,
    ].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    );

    const groupedEntries = new Map<string, HistoryEntry[]>();

    for (const entry of allEntries) {
      const dayKey = getDayKey(entry.loggedAt, timezone);
      const current = groupedEntries.get(dayKey) ?? [];
      current.push(entry);
      groupedEntries.set(dayKey, current);
    }

    const groups: HistoryDayGroup[] = Array.from(groupedEntries.entries()).map(
      ([dayKey, entries]) => ({
        dayKey,
        entries,
      }),
    );

    const hasMore =
      (olderCheckIns.data?.length ?? 0) > 0 ||
      (olderObservations.data?.length ?? 0) > 0;

    return {
      ok: true,
      timezone,
      groups,
      hasMore,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial.",
      timezone: DEFAULT_TIMEZONE,
      groups: [],
      hasMore: false,
    };
  }
}

export async function loadMoreHistoryAction(
  beforeDayKey: string,
  limitDays: number = 5,
): Promise<GetHistoryFeedResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para ver el historial.",
      timezone: DEFAULT_TIMEZONE,
      groups: [],
      hasMore: false,
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const timezone = getSafeTimezone(session.user.timezone);
    const utcBefore = dayKeyToUtcStart(beforeDayKey, timezone);
    const rowLimit = limitDays * 30 + 30;

    const [
      checkInsResponse,
      dropsResponse,
      triggersResponse,
      symptomsResponse,
      observationsResponse,
      sleepResponse,
    ] = await Promise.all([
      supabase
        .from("dy_check_ins")
        .select(
          "id, logged_at, eyelid_pain, temple_pain, masseter_pain, cervical_pain, orbital_pain, trigger_type, notes",
        )
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("dy_drops")
        .select(
          `
            id,
            logged_at,
            quantity,
            eye,
            drop_type:dy_drop_types (
              name
            )
          `,
        )
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("dy_triggers")
        .select("id, logged_at, trigger_type, intensity")
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("dy_symptoms")
        .select("id, logged_at, symptom_type")
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("dy_observation_occurrences")
        .select(
          "id, logged_at, intensity, duration_minutes, notes, dy_clinical_observations(title, eye)",
        )
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("dy_sleep")
        .select("id, logged_at, sleep_hours, sleep_quality")
        .eq("user_id", session.user.id)
        .lt("logged_at", utcBefore)
        .order("logged_at", { ascending: false })
        .limit(rowLimit),
    ]);

    if (checkInsResponse.error) throw checkInsResponse.error;
    if (dropsResponse.error) throw dropsResponse.error;
    if (triggersResponse.error) throw triggersResponse.error;
    if (symptomsResponse.error) throw symptomsResponse.error;
    if (observationsResponse.error) throw observationsResponse.error;

    const sleepByDay2 = new Map<string, HistorySleepEntry>();
    for (const s of sleepResponse.data ?? []) {
      const localDay = getDayKey(s.logged_at, timezone);
      if (!sleepByDay2.has(localDay)) {
        sleepByDay2.set(localDay, {
          id: s.id,
          kind: "sleep",
          loggedAt: s.logged_at,
          sleepHours: s.sleep_hours,
          sleepQuality: s.sleep_quality as HistorySleepEntry["sleepQuality"],
        });
      }
    }
    const sleepEntries2: HistoryEntry[] = Array.from(sleepByDay2.values());

    const checkInEntries: HistoryEntry[] = (checkInsResponse.data ?? []).map(
      (checkIn) => ({
        id: checkIn.id,
        kind: "check_in",
        loggedAt: checkIn.logged_at,
        eyelidPain: checkIn.eyelid_pain,
        templePain: checkIn.temple_pain,
        masseterPain: checkIn.masseter_pain,
        cervicalPain: checkIn.cervical_pain,
        orbitalPain: checkIn.orbital_pain,

        triggerType: (checkIn.trigger_type as TriggerType) ?? null,
        notes: checkIn.notes ?? null,
      }),
    );

    const dropEntries: HistoryEntry[] = (dropsResponse.data ?? []).map(
      (drop) => {
        const dropType = Array.isArray(drop.drop_type)
          ? drop.drop_type[0]
          : drop.drop_type;
        return {
          id: drop.id,
          kind: "drop",
          loggedAt: drop.logged_at,
          quantity: drop.quantity,
          eye: drop.eye as DropEye,
          name: dropType?.name ?? "Gota",
        };
      },
    );

    const triggerEntries: HistoryEntry[] = (triggersResponse.data ?? []).map(
      (trigger) => ({
        id: trigger.id,
        kind: "trigger",
        loggedAt: trigger.logged_at,
        triggerType: trigger.trigger_type as TriggerType,
        intensity: trigger.intensity as 1 | 2 | 3,
      }),
    );

    const symptomEntries: HistoryEntry[] = (symptomsResponse.data ?? []).map(
      (symptom) => ({
        id: symptom.id,
        kind: "symptom",
        loggedAt: symptom.logged_at,
        symptomType: symptom.symptom_type,
      }),
    );

    const observationEntries: HistoryEntry[] = (
      observationsResponse.data ?? []
    ).map((occ) => {
      const type = occ.dy_clinical_observations as unknown as {
        title: string;
        eye: string;
      } | null;
      return {
        id: occ.id,
        kind: "observation",
        loggedAt: occ.logged_at,
        title: (type?.title ?? "") as string,
        eye: (type?.eye ?? "none") as ObservationEye,
        notes: (occ.notes ?? "") as string,
        intensity: occ.intensity as number,
        durationMinutes: (occ.duration_minutes ?? null) as number | null,
      };
    });

    const allEntries = [
      ...checkInEntries,
      ...dropEntries,
      ...triggerEntries,
      ...symptomEntries,
      ...observationEntries,
      ...sleepEntries2,
    ].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    );

    const groupedEntries = new Map<string, HistoryEntry[]>();
    for (const entry of allEntries) {
      const dayKey = getDayKey(entry.loggedAt, timezone);
      const current = groupedEntries.get(dayKey) ?? [];
      current.push(entry);
      groupedEntries.set(dayKey, current);
    }

    const groups: HistoryDayGroup[] = Array.from(groupedEntries.entries()).map(
      ([dayKey, entries]) => ({ dayKey, entries }),
    );

    const hasMore = groups.length > limitDays;

    return {
      ok: true,
      timezone,
      groups: groups.slice(0, limitDays),
      hasMore,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial.",
      timezone: DEFAULT_TIMEZONE,
      groups: [],
      hasMore: false,
    };
  }
}
