import { Droplets, Moon, Zap } from "lucide-react";
import type { GetHistoryFeedResult, HistoryDayGroup } from "@/lib/actions/history";
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

  if (dayKey === todayKey) {
    return "Hoy";
  }

  if (dayKey === yesterdayKey) {
    return "Ayer";
  }

  const dayParts = dayKey.split("-").map((value) => Number(value));

  if (dayParts.length !== 3 || dayParts.some((value) => Number.isNaN(value))) {
    return dayKey;
  }

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
  return group.entries.map((entry) => {
    if (entry.kind === "check_in") {
      return (
        <article key={entry.id} className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Check-in rapido</span>
            <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(entry.loggedAt, timezone)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px] text-[var(--text-muted)]">
            <span>Parpados {entry.eyelidPain}</span>
            <span>Sienes {entry.templePain}</span>
            <span>Masetero {entry.masseterPain}</span>
            <span>Cervical {entry.cervicalPain}</span>
            <span>Orbital {entry.orbitalPain}</span>
            <span>General {entry.overallPain}</span>
          </div>
          {entry.sleepHours !== null ? (
            <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <Moon size={14} />
              {entry.sleepHours}h de sueno
            </div>
          ) : null}
        </article>
      );
    }

    if (entry.kind === "drop") {
      const dropLabel = `${entry.name}, ${entry.quantity} ${entry.quantity === 1 ? "gota" : "gotas"}, ${EYE_LABELS[entry.eye]}`;

      return (
        <article
          key={entry.id}
          className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Droplets size={14} />
              <span>{dropLabel}</span>
            </div>
            <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(entry.loggedAt, timezone)}</span>
          </div>
        </article>
      );
    }

    return (
      <article
        key={entry.id}
        className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap size={14} />
            <span>
              {TRIGGER_LABELS[entry.triggerType]} {entry.intensity}
            </span>
          </div>
          <span className="mono text-[11px] text-[var(--text-muted)]">{formatTime(entry.loggedAt, timezone)}</span>
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
