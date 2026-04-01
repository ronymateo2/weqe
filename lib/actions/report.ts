"use server";

import { sampleCorrelation } from "simple-statistics";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSafeTimezone, getDayKey } from "@/lib/utils/timezone";
import type { TriggerType } from "@/types/domain";

export type ReportTrendPoint = {
  dayKey: string;
  overallPain: number;
};

export type ReportCorrelationPoint = {
  sleepHours: number;
  masseterPain: number;
};

export type ReportTriggerStat = {
  triggerType: TriggerType;
  days: number;
};

export type ReportAveragePain = {
  overall: number;
  eyelid: number;
  temple: number;
  masseter: number;
};

export type ReportDataSuccess = {
  ok: true;
  userName: string | null;
  checkInsCount: number;
  dateRange: string;
  hasEnoughData: boolean;
  averagePain: ReportAveragePain | null;
  averageSleepHours: number | null;
  averageSleepQuality: number | null;
  spearman: number | null;
  correlationLabel: string;
  correlationPoints: ReportCorrelationPoint[];
  trendPoints: ReportTrendPoint[];
  dropsPerDay: number | null;
  topTriggers: ReportTriggerStat[];
};

export type ReportDataResult =
  | ReportDataSuccess
  | { ok: false; message: string };

const MIN_RECORDS = 14;


function getAverageRank(values: number[]) {
  const indexed = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let cursor = 0;
  while (cursor < indexed.length) {
    let end = cursor + 1;
    while (
      end < indexed.length &&
      indexed[end].value === indexed[cursor].value
    ) {
      end += 1;
    }
    const averageRank = (cursor + 1 + end) / 2;
    for (let i = cursor; i < end; i += 1) {
      ranks[indexed[i].index] = averageRank;
    }
    cursor = end;
  }
  return ranks;
}

function getSpearmanCorrelation(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return null;
  return sampleCorrelation(getAverageRank(x), getAverageRank(y));
}

function formatDateRange(from: string, to: string) {
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic"
  ];
  const parse = (s: string) => {
    const [year, month, day] = s.split("-").map(Number);
    return { year, month: month ?? 1, day: day ?? 1 };
  };
  const f = parse(from);
  const t = parse(to);
  if (f.year === t.year) {
    if (f.month === t.month) {
      return `${f.day} — ${t.day} ${months[t.month - 1]} ${t.year}`;
    }
    return `${f.day} ${months[f.month - 1]} — ${t.day} ${months[t.month - 1]} ${t.year}`;
  }
  return `${f.day} ${months[f.month - 1]} ${f.year} — ${t.day} ${months[t.month - 1]} ${t.year}`;
}

function getCorrelationLabel(spearman: number | null): string {
  if (spearman === null) return "—";
  const abs = Math.abs(spearman);
  if (abs >= 0.7) return spearman < 0 ? "fuerte negativa" : "fuerte positiva";
  if (abs >= 0.4) return spearman < 0 ? "moderada" : "moderada positiva";
  return "débil";
}

export async function getReportDataAction(): Promise<ReportDataResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Necesitas iniciar sesión." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const [userRes, checkInsRes, dropsRes, triggersRes] = await Promise.all([
      supabase
        .from("dy_users")
        .select("timezone, name")
        .eq("id", session.user.id)
        .maybeSingle(),
      supabase
        .from("dy_check_ins")
        .select(
          "id, logged_at, time_of_day, eyelid_pain, temple_pain, masseter_pain, overall_pain, sleep_hours, sleep_quality"
        )
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: true })
        .limit(2000),
      supabase
        .from("dy_drops")
        .select("id, logged_at, quantity")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(2000),
      supabase
        .from("dy_triggers")
        .select("id, logged_at, trigger_type")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(2000)
    ]);

    if (userRes.error) throw userRes.error;
    if (checkInsRes.error) throw checkInsRes.error;
    if (dropsRes.error) throw dropsRes.error;
    if (triggersRes.error) throw triggersRes.error;

    const timezone = getSafeTimezone(userRes.data?.timezone);
    const userName =
      userRes.data?.name ?? session.user.name ?? null;
    const checkIns = checkInsRes.data ?? [];
    const drops = dropsRes.data ?? [];
    const triggers = triggersRes.data ?? [];

    const checkInsCount = checkIns.length;
    const hasEnoughData = checkInsCount >= MIN_RECORDS;

    // Date range
    let dateRange = "—";
    if (checkIns.length > 0) {
      const firstKey = getDayKey(checkIns[0].logged_at, timezone);
      const lastKey = getDayKey(
        checkIns[checkIns.length - 1].logged_at,
        timezone
      );
      dateRange = formatDateRange(firstKey, lastKey);
    }

    // Average pain
    let averagePain: ReportAveragePain | null = null;
    if (checkIns.length > 0) {
      const totals = checkIns.reduce(
        (acc, ci) => ({
          overall: acc.overall + ci.overall_pain,
          eyelid: acc.eyelid + ci.eyelid_pain,
          temple: acc.temple + ci.temple_pain,
          masseter: acc.masseter + ci.masseter_pain
        }),
        { overall: 0, eyelid: 0, temple: 0, masseter: 0 }
      );
      const n = checkIns.length;
      averagePain = {
        overall: Number((totals.overall / n).toFixed(1)),
        eyelid: Number((totals.eyelid / n).toFixed(1)),
        temple: Number((totals.temple / n).toFixed(1)),
        masseter: Number((totals.masseter / n).toFixed(1))
      };
    }

    // Average sleep
    const withSleep = checkIns.filter((ci) => ci.sleep_hours !== null);
    const averageSleepHours =
      withSleep.length > 0
        ? Number(
            (
              withSleep.reduce(
                (sum, ci) => sum + Number(ci.sleep_hours),
                0
              ) / withSleep.length
            ).toFixed(1)
          )
        : null;

    const withQuality = withSleep.filter((ci) => ci.sleep_quality !== null);
    const averageSleepQuality =
      withQuality.length > 0
        ? Number(
            (
              withQuality.reduce(
                (sum, ci) => sum + (ci.sleep_quality as number),
                0
              ) / withQuality.length
            ).toFixed(1)
          )
        : null;

    // Spearman (morning check-ins with sleep_hours)
    const correlationPoints: ReportCorrelationPoint[] = checkIns
      .filter((ci) => ci.time_of_day === "morning" && ci.sleep_hours !== null)
      .map((ci) => ({
        sleepHours: Number(ci.sleep_hours),
        masseterPain: ci.masseter_pain
      }));

    const spearmanRaw =
      correlationPoints.length >= MIN_RECORDS
        ? getSpearmanCorrelation(
            correlationPoints.map((p) => p.sleepHours),
            correlationPoints.map((p) => p.masseterPain)
          )
        : null;
    const spearman =
      spearmanRaw !== null ? Number(spearmanRaw.toFixed(2)) : null;
    const correlationLabel = getCorrelationLabel(spearman);

    // Trend points (daily averages, all time)
    const trendBucket = new Map<
      string,
      { count: number; overallPain: number }
    >();
    for (const ci of checkIns) {
      const dayKey = getDayKey(ci.logged_at, timezone);
      const current = trendBucket.get(dayKey) ?? {
        count: 0,
        overallPain: 0
      };
      current.count += 1;
      current.overallPain += ci.overall_pain;
      trendBucket.set(dayKey, current);
    }
    const trendPoints: ReportTrendPoint[] = Array.from(trendBucket.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, bucket]) => ({
        dayKey,
        overallPain: Number((bucket.overallPain / bucket.count).toFixed(2))
      }));

    // Drops per day
    let dropsPerDay: number | null = null;
    if (drops.length > 0 && trendPoints.length > 0) {
      const totalDropQty = drops.reduce((sum, d) => sum + d.quantity, 0);
      dropsPerDay = Number((totalDropQty / trendPoints.length).toFixed(1));
    }

    // Top triggers (all time, by unique days)
    const triggerDaysByType = new Map<TriggerType, Set<string>>();
    for (const trigger of triggers) {
      const dayKey = getDayKey(trigger.logged_at, timezone);
      const triggerType = trigger.trigger_type as TriggerType;
      const daySet = triggerDaysByType.get(triggerType) ?? new Set<string>();
      daySet.add(dayKey);
      triggerDaysByType.set(triggerType, daySet);
    }
    const topTriggers: ReportTriggerStat[] = Array.from(
      triggerDaysByType.entries()
    )
      .map(([triggerType, daysSet]) => ({ triggerType, days: daysSet.size }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    return {
      ok: true,
      userName,
      checkInsCount,
      dateRange,
      hasEnoughData,
      averagePain,
      averageSleepHours,
      averageSleepQuality,
      spearman,
      correlationLabel,
      correlationPoints,
      trendPoints,
      dropsPerDay,
      topTriggers
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el reporte."
    };
  }
}
