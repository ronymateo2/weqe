import { Activity, Droplets, Moon, Zap } from "lucide-react";
import { SYMPTOM_OPTIONS } from "@/lib/constants";
import type { GetHistoryFeedResult, HistoryDayGroup, HistoryEntry } from "@/lib/actions/history";
import type { TriggerType } from "@/types/domain";
import { StatusBanner } from "@/components/ui/status-banner";

type HistoryScreenProps = {
  historyFeed: GetHistoryFeedResult;
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  climate: "Clima",
  humidifier: "Humidificador",
  stress: "Estres",
  screens: "Pantallas",
  tv: "TV",
  ergonomics: "Ergonomia",
  exercise: "Ejercicio",
  other: "Otro"
};

const EYE_LABELS = {
  left: "ojo izquierdo",
  right: "ojo derecho",
  both: "ambos ojos"
} as const;

// Grouped display types produced by collapseEntries
type DisplayCheckIn = { kind: "check_in"; id: string; loggedAt: string; eyelidPain: number; templePain: number; masseterPain: number; cervicalPain: number; orbitalPain: number; overallPain: number; sleepHours: number | null };
type DisplayDrop = { kind: "drop"; id: string; loggedAt: string; name: string; quantity: number; eye: "left" | "right" | "both" };
type DisplayTriggerGroup = { kind: "trigger_group"; id: string; loggedAt: string; triggers: { triggerType: TriggerType; intensity: 1 | 2 | 3 }[] };
type DisplaySymptomGroup = { kind: "symptom_group"; id: string; loggedAt: string; symptomTypes: string[] };
type DisplayItem = DisplayCheckIn | DisplayDrop | DisplayTriggerGroup | DisplaySymptomGroup;

function collapseEntries(entries: HistoryEntry[]): DisplayItem[] {
  const result: DisplayItem[] = [];

  for (const entry of entries) {
    if (entry.kind === "check_in" || entry.kind === "drop") {
      result.push(entry as DisplayCheckIn | DisplayDrop);
      continue;
    }

    if (entry.kind === "trigger") {
      const last = result[result.length - 1];
      if (last?.kind === "trigger_group" && last.loggedAt === entry.loggedAt) {
        last.triggers.push({ triggerType: entry.triggerType, intensity: entry.intensity });
      } else {
        result.push({
          kind: "trigger_group",
          id: entry.id,
          loggedAt: entry.loggedAt,
          triggers: [{ triggerType: entry.triggerType, intensity: entry.intensity }]
        });
      }
      continue;
    }

    if (entry.kind === "symptom") {
      const last = result[result.length - 1];
      if (last?.kind === "symptom_group" && last.loggedAt === entry.loggedAt) {
        last.symptomTypes.push(entry.symptomType);
      } else {
        result.push({
          kind: "symptom_group",
          id: entry.id,
          loggedAt: entry.loggedAt,
          symptomTypes: [entry.symptomType]
        });
      }
    }
  }

  return result;
}

function formatTime(loggedAt: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone
  }).format(new Date(loggedAt));
}

function getDayLabel(dayKey: string, timezone: string) {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  const yesterdayKey = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: timezone });

  if (dayKey === todayKey) return "Hoy";
  if (dayKey === yesterdayKey) return "Ayer";

  const dayParts = dayKey.split("-").map((value) => Number(value));
  if (dayParts.length !== 3 || dayParts.some((value) => Number.isNaN(value))) return dayKey;

  const [year, month, day] = dayParts;
  const normalizedDate = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(normalizedDate);
}

function renderDayEntries(group: HistoryDayGroup, timezone: string) {
  const items = collapseEntries(group.entries);

  return items.map((item) => {
    if (item.kind === "check_in") {
      return (
        <article key={item.id} className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Check-in rapido</span>
            <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(item.loggedAt, timezone)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px] text-[var(--text-muted)]">
            <span>Parpados {item.eyelidPain}</span>
            <span>Sienes {item.templePain}</span>
            <span>Masetero {item.masseterPain}</span>
            <span>Cervical {item.cervicalPain}</span>
            <span>Orbital {item.orbitalPain}</span>
            <span>General {item.overallPain}</span>
          </div>
          {item.sleepHours !== null ? (
            <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <Moon size={14} />
              {item.sleepHours}h de sueno
            </div>
          ) : null}
        </article>
      );
    }

    if (item.kind === "drop") {
      const dropLabel = `${item.name}, ${item.quantity} ${item.quantity === 1 ? "gota" : "gotas"}, ${EYE_LABELS[item.eye]}`;

      return (
        <article
          key={item.id}
          className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Droplets size={14} />
              <span>{dropLabel}</span>
            </div>
            <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(item.loggedAt, timezone)}</span>
          </div>
        </article>
      );
    }

    if (item.kind === "trigger_group") {
      return (
        <article
          key={item.id}
          className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span className="font-medium text-[var(--text-primary)]">Triggers</span>
            </div>
            <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(item.loggedAt, timezone)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {item.triggers.map((t, i) => (
              <span key={i}>
                {TRIGGER_LABELS[t.triggerType]}{" "}
                <span className="opacity-60">{String.fromCharCode(9311 + t.intensity)}</span>
              </span>
            ))}
          </div>
        </article>
      );
    }

    // symptom_group
    return (
      <article
        key={item.id}
        className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span className="font-medium text-[var(--text-primary)]">Sintomas</span>
          </div>
          <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(item.loggedAt, timezone)}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {item.symptomTypes.map((type, i) => {
            const label = SYMPTOM_OPTIONS.find((o) => o.value === type)?.label ?? type;
            return <span key={i}>{label}</span>;
          })}
        </div>
      </article>
    );
  });
}

export function HistoryScreen({ historyFeed }: HistoryScreenProps) {
  if (!historyFeed.ok) {
    return (
      <section className="space-y-8">
        <StatusBanner message={historyFeed.message} tone="error" />
      </section>
    );
  }

  if (historyFeed.groups.length === 0) {
    return (
      <section className="space-y-8">
        <StatusBanner
          message="Aun no tienes registros. Ve a Registrar para empezar y cuando guardes veremos aqui check-ins, gotas y triggers agrupados por dia."
          tone="info"
        />
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-6">
        {historyFeed.groups.map((group) => (
          <div key={group.dayKey}>
            <p className="section-label">{getDayLabel(group.dayKey, historyFeed.timezone)}</p>
            <div className="space-y-3">{renderDayEntries(group, historyFeed.timezone)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
