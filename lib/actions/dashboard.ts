"use server";

import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSpearmanCorrelation } from "@/lib/stats";
import {
  getSafeTimezone,
  getDayKey,
  DEFAULT_TIMEZONE,
} from "@/lib/utils/timezone";
import type { TriggerType } from "@/types/domain";

type TrendPoint = {
  dayKey: string;
  label: string;
  eyelidPain: number | null;
  templePain: number | null;
  masseterPain: number | null;
  cervicalPain: number | null;
  orbitalPain: number | null;
};

type DropsDayPoint = {
  dayKey: string;
  label: string;
  quantities: Record<string, number>;
};

type CorrelationPoint = {
  sleepHours: number;
  masseterPain: number;
};

type TriggerStat = {
  triggerType: TriggerType;
  days: number;
};

type TriggerZoneStat = {
  triggerType: TriggerType;
  avgEyelidPain: number;
  avgTemplePain: number;
  days: number;
};

type DashboardSuccess = {
  ok: true;
  timezone: string;
  trend: {
    points: TrendPoint[];
    daysWithData: number;
    average7d: number | null;
    average30d: number | null;
  };
  correlation: {
    minimumRequired: number;
    sampleSize: number;
    spearman: number | null;
    insight: string;
    points: CorrelationPoint[];
  };
  highPainTriggerStats: TriggerStat[];
  triggerZonePainStats: TriggerZoneStat[];
  drops: {
    dropTypes: string[];
    points: DropsDayPoint[];
  };
};

type DashboardError = {
  ok: false;
  message: string;
  timezone: string;
  trend: {
    points: [];
    daysWithData: 0;
    average7d: null;
    average30d: null;
  };
  correlation: {
    minimumRequired: number;
    sampleSize: 0;
    spearman: null;
    insight: string;
    points: [];
  };
  highPainTriggerStats: [];
  triggerZonePainStats: [];
  drops: { dropTypes: []; points: [] };
};

export type DashboardDataResult = DashboardSuccess | DashboardError;

const MIN_CORRELATION_SAMPLES = 14;

function formatShortDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    return dayKey;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function buildLastDayKeys(timezone: string, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => {
    const offset = totalDays - 1 - index;
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  });
}


function getCorrelationInsight(spearman: number | null, samples: number) {
  if (samples < MIN_CORRELATION_SAMPLES) {
    return `Necesitas ${MIN_CORRELATION_SAMPLES} registros matutinos con sueno para activar esta correlacion clinica.`;
  }

  if (spearman === null) {
    return "No hay suficiente variacion en los datos para calcular correlacion.";
  }

  if (spearman <= -0.5) {
    return "A mas horas de sueno, menor dolor de masetero en tu registro reciente.";
  }

  if (spearman < -0.2) {
    return "Hay una tendencia moderada: dormir mas se asocia con menos dolor de masetero.";
  }

  if (spearman < 0.2) {
    return "La relacion entre horas de sueno y dolor de masetero es debil por ahora.";
  }

  if (spearman < 0.5) {
    return "Hay una tendencia moderada: dormir mas se asocia con mayor dolor de masetero.";
  }

  return "La relacion observada es fuerte: mas horas de sueno coinciden con mayor dolor de masetero.";
}

export async function getDashboardDataAction(): Promise<DashboardDataResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Necesitas iniciar sesion para ver el dashboard.",
      timezone: DEFAULT_TIMEZONE,
      trend: { points: [], daysWithData: 0, average7d: null, average30d: null },
      correlation: {
        minimumRequired: MIN_CORRELATION_SAMPLES,
        sampleSize: 0,
        spearman: null,
        insight: `Necesitas ${MIN_CORRELATION_SAMPLES} registros matutinos con sueno para activar esta correlacion clinica.`,
        points: [],
      },
      highPainTriggerStats: [],
      triggerZonePainStats: [],
      drops: { dropTypes: [], points: [] },
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from("dy_users")
      .select("timezone")
      .eq("id", session.user.id)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    const timezone = getSafeTimezone(user?.timezone);

    const [checkInsResponse, triggersResponse, dropsResponse] = await Promise.all([
      supabase
        .from("dy_check_ins")
        .select(
          "id, logged_at, time_of_day, eyelid_pain, temple_pain, masseter_pain, cervical_pain, orbital_pain, sleep_hours",
        )
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(500),
      supabase
        .from("dy_triggers")
        .select("id, logged_at, trigger_type")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(500),
      supabase
        .from("dy_drops")
        .select("logged_at, quantity, drop_type:dy_drop_types(name)")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(500),
    ]);

    if (checkInsResponse.error) {
      throw checkInsResponse.error;
    }

    if (triggersResponse.error) {
      throw triggersResponse.error;
    }

    if (dropsResponse.error) {
      throw dropsResponse.error;
    }

    const checkIns = checkInsResponse.data ?? [];
    const triggers = triggersResponse.data ?? [];
    const drops = dropsResponse.data ?? [];

    const last30DayKeys = buildLastDayKeys(timezone, 30);
    const last30Set = new Set(last30DayKeys);

    const trendBucket = new Map<
      string,
      {
        count: number;
        eyelidPain: number;
        templePain: number;
        masseterPain: number;
        cervicalPain: number;
        orbitalPain: number;
      }
    >();

    const dayPainMap = new Map<string, { eyelidSum: number; templeSum: number; count: number }>();
    const highPainDaySet = new Set<string>();
    const correlationPoints: CorrelationPoint[] = [];

    for (const checkIn of checkIns) {
      const dayKey = getDayKey(checkIn.logged_at, timezone);

      if (last30Set.has(dayKey)) {
        const current = trendBucket.get(dayKey) ?? {
          count: 0,
          eyelidPain: 0,
          templePain: 0,
          masseterPain: 0,
          cervicalPain: 0,
          orbitalPain: 0,
        };

        current.count += 1;
        current.eyelidPain += checkIn.eyelid_pain;
        current.templePain += checkIn.temple_pain;
        current.masseterPain += checkIn.masseter_pain;
        current.cervicalPain += checkIn.cervical_pain;
        current.orbitalPain += checkIn.orbital_pain;
        trendBucket.set(dayKey, current);
      }

      const dayPain = dayPainMap.get(dayKey) ?? { eyelidSum: 0, templeSum: 0, count: 0 };
      dayPain.eyelidSum += checkIn.eyelid_pain;
      dayPain.templeSum += checkIn.temple_pain;
      dayPain.count += 1;
      dayPainMap.set(dayKey, dayPain);

      const meanPain =
        (checkIn.eyelid_pain + checkIn.temple_pain + checkIn.masseter_pain + checkIn.cervical_pain + checkIn.orbital_pain) / 5;
      if (meanPain >= 7) {
        highPainDaySet.add(dayKey);
      }

      if (checkIn.time_of_day === "morning" && checkIn.sleep_hours !== null) {
        correlationPoints.push({
          sleepHours: Number(checkIn.sleep_hours),
          masseterPain: checkIn.masseter_pain,
        });
      }
    }

    const trendPoints: TrendPoint[] = last30DayKeys.map((dayKey) => {
      const bucket = trendBucket.get(dayKey);
      if (!bucket || bucket.count === 0) {
        return {
          dayKey,
          label: formatShortDayLabel(dayKey),
          eyelidPain: null,
          templePain: null,
          masseterPain: null,
          cervicalPain: null,
          orbitalPain: null,
        };
      }

      const base = bucket.count;
      return {
        dayKey,
        label: formatShortDayLabel(dayKey),
        eyelidPain: Number((bucket.eyelidPain / base).toFixed(2)),
        templePain: Number((bucket.templePain / base).toFixed(2)),
        masseterPain: Number((bucket.masseterPain / base).toFixed(2)),
        cervicalPain: Number((bucket.cervicalPain / base).toFixed(2)),
        orbitalPain: Number((bucket.orbitalPain / base).toFixed(2)),
      };
    });

    const daysWithData = trendPoints.filter(
      (item) => item.eyelidPain !== null,
    ).length;
    const meanPainForPoint = (p: (typeof trendPoints)[number]) =>
      p.eyelidPain !== null
        ? (p.eyelidPain + (p.templePain ?? 0) + (p.masseterPain ?? 0) + (p.cervicalPain ?? 0) + (p.orbitalPain ?? 0)) / 5
        : null;
    const last7 = trendPoints
      .slice(-7)
      .map(meanPainForPoint)
      .filter((value): value is number => value !== null);
    const last30 = trendPoints
      .map(meanPainForPoint)
      .filter((value): value is number => value !== null);
    const average7d = last7.length
      ? Number(
          (last7.reduce((sum, value) => sum + value, 0) / last7.length).toFixed(2),
        )
      : null;
    const average30d = last30.length
      ? Number(
          (last30.reduce((sum, value) => sum + value, 0) / last30.length).toFixed(2),
        )
      : null;

    const sleepValues = correlationPoints.map((item) => item.sleepHours);
    const masseterValues = correlationPoints.map((item) => item.masseterPain);
    const spearman = getSpearmanCorrelation(sleepValues, masseterValues);
    const correlationInsight = getCorrelationInsight(
      spearman,
      correlationPoints.length,
    );

    const triggerDaysByType = new Map<TriggerType, Set<string>>();

    for (const trigger of triggers) {
      const dayKey = getDayKey(trigger.logged_at, timezone);
      if (!highPainDaySet.has(dayKey)) {
        continue;
      }

      const triggerType = trigger.trigger_type as TriggerType;
      const daySet = triggerDaysByType.get(triggerType) ?? new Set<string>();
      daySet.add(dayKey);
      triggerDaysByType.set(triggerType, daySet);
    }

    const highPainTriggerStats: TriggerStat[] = Array.from(
      triggerDaysByType.entries(),
    )
      .map(([triggerType, daysSet]) => ({
        triggerType,
        days: daysSet.size,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    const triggerZoneMap = new Map<TriggerType, { dayKeys: Set<string>; eyelidSum: number; templeSum: number }>();

    for (const trigger of triggers) {
      const dayKey = getDayKey(trigger.logged_at, timezone);
      const dayPain = dayPainMap.get(dayKey);
      if (!dayPain || dayPain.count === 0) continue;

      const triggerType = trigger.trigger_type as TriggerType;
      const existing = triggerZoneMap.get(triggerType) ?? { dayKeys: new Set<string>(), eyelidSum: 0, templeSum: 0 };
      if (!existing.dayKeys.has(dayKey)) {
        existing.dayKeys.add(dayKey);
        existing.eyelidSum += dayPain.eyelidSum / dayPain.count;
        existing.templeSum += dayPain.templeSum / dayPain.count;
      }
      triggerZoneMap.set(triggerType, existing);
    }

    const triggerZonePainStats: TriggerZoneStat[] = Array.from(triggerZoneMap.entries())
      .map(([triggerType, data]) => ({
        triggerType,
        avgEyelidPain: Number((data.eyelidSum / data.dayKeys.size).toFixed(2)),
        avgTemplePain: Number((data.templeSum / data.dayKeys.size).toFixed(2)),
        days: data.dayKeys.size,
      }))
      .sort((a, b) => b.avgEyelidPain + b.avgTemplePain - (a.avgEyelidPain + a.avgTemplePain));

    const dropsBucket = new Map<string, Map<string, number>>();

    for (const drop of drops) {
      const dayKey = getDayKey(drop.logged_at, timezone);
      if (!last30Set.has(dayKey)) continue;

      const dropType = drop.drop_type as unknown as { name: string } | null;
      const typeName = dropType?.name ?? "otro";
      const dayMap = dropsBucket.get(dayKey) ?? new Map<string, number>();
      dayMap.set(typeName, (dayMap.get(typeName) ?? 0) + drop.quantity);
      dropsBucket.set(dayKey, dayMap);
    }

    const allDropTypes = Array.from(
      new Set(Array.from(dropsBucket.values()).flatMap((m) => Array.from(m.keys()))),
    ).sort();

    const dropsPoints: DropsDayPoint[] = last30DayKeys.map((dayKey) => {
      const dayMap = dropsBucket.get(dayKey);
      const quantities: Record<string, number> = {};
      for (const t of allDropTypes) quantities[t] = dayMap?.get(t) ?? 0;
      return { dayKey, label: formatShortDayLabel(dayKey), quantities };
    });

    return {
      ok: true,
      timezone,
      trend: {
        points: trendPoints,
        daysWithData,
        average7d,
        average30d,
      },
      correlation: {
        minimumRequired: MIN_CORRELATION_SAMPLES,
        sampleSize: correlationPoints.length,
        spearman: spearman !== null ? Number(spearman.toFixed(3)) : null,
        insight: correlationInsight,
        points: correlationPoints,
      },
      highPainTriggerStats,
      triggerZonePainStats,
      drops: { dropTypes: allDropTypes, points: dropsPoints },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el dashboard.",
      timezone: DEFAULT_TIMEZONE,
      trend: { points: [], daysWithData: 0, average7d: null, average30d: null },
      correlation: {
        minimumRequired: MIN_CORRELATION_SAMPLES,
        sampleSize: 0,
        spearman: null,
        insight: `Necesitas ${MIN_CORRELATION_SAMPLES} registros matutinos con sueno para activar esta correlacion clinica.`,
        points: [],
      },
      highPainTriggerStats: [],
      triggerZonePainStats: [],
      drops: { dropTypes: [], points: [] },
    };
  }
}
