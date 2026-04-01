"use server";

import { sampleCorrelation } from "simple-statistics";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSafeTimezone, getDayKey, DEFAULT_TIMEZONE } from "@/lib/utils/timezone";
import type { TriggerType } from "@/types/domain";

type TrendPoint = {
  dayKey: string;
  label: string;
  eyelidPain: number | null;
  templePain: number | null;
  masseterPain: number | null;
  overallPain: number | null;
};

type CorrelationPoint = {
  sleepHours: number;
  masseterPain: number;
};

type TriggerStat = {
  triggerType: TriggerType;
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
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function buildLastDayKeys(timezone: string, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => {
    const offset = totalDays - 1 - index;
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  });
}

function getAverageRank(values: number[]) {
  const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);

  let cursor = 0;
  while (cursor < indexed.length) {
    let end = cursor + 1;
    while (end < indexed.length && indexed[end].value === indexed[cursor].value) {
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
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  const rankX = getAverageRank(x);
  const rankY = getAverageRank(y);

  return sampleCorrelation(rankX, rankY);
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
        points: []
      },
      highPainTriggerStats: []
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

    const [checkInsResponse, triggersResponse] = await Promise.all([
      supabase
        .from("dy_check_ins")
        .select("id, logged_at, time_of_day, eyelid_pain, temple_pain, masseter_pain, overall_pain, sleep_hours")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(500),
      supabase
        .from("dy_triggers")
        .select("id, logged_at, trigger_type")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(500)
    ]);

    if (checkInsResponse.error) {
      throw checkInsResponse.error;
    }

    if (triggersResponse.error) {
      throw triggersResponse.error;
    }

    const checkIns = checkInsResponse.data ?? [];
    const triggers = triggersResponse.data ?? [];

    const last30DayKeys = buildLastDayKeys(timezone, 30);
    const last30Set = new Set(last30DayKeys);

    const trendBucket = new Map<
      string,
      {
        count: number;
        eyelidPain: number;
        templePain: number;
        masseterPain: number;
        overallPain: number;
      }
    >();

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
          overallPain: 0
        };

        current.count += 1;
        current.eyelidPain += checkIn.eyelid_pain;
        current.templePain += checkIn.temple_pain;
        current.masseterPain += checkIn.masseter_pain;
        current.overallPain += checkIn.overall_pain;
        trendBucket.set(dayKey, current);
      }

      if (checkIn.overall_pain >= 7) {
        highPainDaySet.add(dayKey);
      }

      if (checkIn.time_of_day === "morning" && checkIn.sleep_hours !== null) {
        correlationPoints.push({
          sleepHours: Number(checkIn.sleep_hours),
          masseterPain: checkIn.masseter_pain
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
          overallPain: null
        };
      }

      const base = bucket.count;
      return {
        dayKey,
        label: formatShortDayLabel(dayKey),
        eyelidPain: Number((bucket.eyelidPain / base).toFixed(2)),
        templePain: Number((bucket.templePain / base).toFixed(2)),
        masseterPain: Number((bucket.masseterPain / base).toFixed(2)),
        overallPain: Number((bucket.overallPain / base).toFixed(2))
      };
    });

    const daysWithData = trendPoints.filter((item) => item.overallPain !== null).length;
    const last7 = trendPoints.slice(-7).map((point) => point.overallPain).filter((value): value is number => value !== null);
    const last30 = trendPoints.map((point) => point.overallPain).filter((value): value is number => value !== null);
    const average7d = last7.length ? Number((last7.reduce((sum, value) => sum + value, 0) / last7.length).toFixed(2)) : null;
    const average30d = last30.length
      ? Number((last30.reduce((sum, value) => sum + value, 0) / last30.length).toFixed(2))
      : null;

    const sleepValues = correlationPoints.map((item) => item.sleepHours);
    const masseterValues = correlationPoints.map((item) => item.masseterPain);
    const spearman = getSpearmanCorrelation(sleepValues, masseterValues);
    const correlationInsight = getCorrelationInsight(spearman, correlationPoints.length);

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

    const highPainTriggerStats: TriggerStat[] = Array.from(triggerDaysByType.entries())
      .map(([triggerType, daysSet]) => ({
        triggerType,
        days: daysSet.size
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    return {
      ok: true,
      timezone,
      trend: {
        points: trendPoints,
        daysWithData,
        average7d,
        average30d
      },
      correlation: {
        minimumRequired: MIN_CORRELATION_SAMPLES,
        sampleSize: correlationPoints.length,
        spearman: spearman !== null ? Number(spearman.toFixed(3)) : null,
        insight: correlationInsight,
        points: correlationPoints
      },
      highPainTriggerStats
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo cargar el dashboard.",
      timezone: DEFAULT_TIMEZONE,
      trend: { points: [], daysWithData: 0, average7d: null, average30d: null },
      correlation: {
        minimumRequired: MIN_CORRELATION_SAMPLES,
        sampleSize: 0,
        spearman: null,
        insight: `Necesitas ${MIN_CORRELATION_SAMPLES} registros matutinos con sueno para activar esta correlacion clinica.`,
        points: []
      },
      highPainTriggerStats: []
    };
  }
}
