import {
  PulseIcon,
  CheckIcon,
  CaretRightIcon,
  DropIcon,
  MoonIcon,
  SunIcon,
  LightningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SYMPTOM_OPTIONS } from "@/lib/constants";
import type {
  GetHistoryFeedResult,
  HistoryDayGroup,
  HistoryEntry,
} from "@/lib/actions/history";
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
  other: "Otro",
};

const EYE_LABELS = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
} as const;

// Grouped display types produced by collapseEntries
type DisplayCheckIn = {
  kind: "check_in";
  id: string;
  loggedAt: string;
  eyelidPain: number;
  templePain: number;
  masseterPain: number;
  cervicalPain: number;
  orbitalPain: number;
  sleepHours: number | null;
  triggerType: TriggerType | null;
  notes: string | null;
};
type DisplayDrop = {
  kind: "drop";
  id: string;
  loggedAt: string;
  name: string;
  quantity: number;
  eye: "left" | "right" | "both";
};
type DisplayTriggerGroup = {
  kind: "trigger_group";
  id: string;
  loggedAt: string;
  triggers: { triggerType: TriggerType; intensity: 1 | 2 | 3 }[];
};
type DisplaySymptomGroup = {
  kind: "symptom_group";
  id: string;
  loggedAt: string;
  symptomTypes: string[];
};
type DisplayItem =
  | DisplayCheckIn
  | DisplayDrop
  | DisplayTriggerGroup
  | DisplaySymptomGroup;

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
        last.triggers.push({
          triggerType: entry.triggerType,
          intensity: entry.intensity,
        });
      } else {
        result.push({
          kind: "trigger_group",
          id: entry.id,
          loggedAt: entry.loggedAt,
          triggers: [
            { triggerType: entry.triggerType, intensity: entry.intensity },
          ],
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
          symptomTypes: [entry.symptomType],
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
    timeZone: timezone,
  }).format(new Date(loggedAt));
}

function formatShortDate(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(date)
    .toUpperCase()
    .replace(".", "");
}

function getDayPillLabel(dayKey: string, timezone: string): string | null {
  const todayKey = new Date().toLocaleDateString("en-CA", {
    timeZone: timezone,
  });
  const yesterdayKey = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toLocaleDateString("en-CA", { timeZone: timezone });
  if (dayKey === todayKey) return "HOY";
  if (dayKey === yesterdayKey) return "AYER";
  return null;
}

function getTimeOfDay(
  loggedAt: string,
  timezone: string,
): { label: string; isMoon: boolean } {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(new Date(loggedAt)),
    10,
  );
  if (hour >= 6 && hour < 12) return { label: "Mañana", isMoon: false };
  if (hour >= 12 && hour < 19) return { label: "Tarde", isMoon: false };
  return { label: "Noche", isMoon: true };
}

function painColor(score: number): string {
  if (score >= 7) return "var(--pain-high)";
  if (score >= 4) return "var(--pain-mid)";
  return "var(--pain-low)";
}

function intensityColor(intensity: 1 | 2 | 3): string {
  if (intensity === 3) return "var(--pain-high)";
  if (intensity === 2) return "var(--pain-mid)";
  return "var(--accent)";
}

function getDotColor(item: DisplayItem): string {
  if (item.kind === "check_in") return "var(--accent)";
  if (item.kind === "trigger_group") {
    const max = Math.max(...item.triggers.map((t) => t.intensity)) as 1 | 2 | 3;
    return intensityColor(max);
  }
  if (item.kind === "drop") return "var(--pain-low)";
  return "var(--text-muted)";
}

const SCORE_FIELDS: { key: keyof DisplayCheckIn; label: string }[] = [
  { key: "eyelidPain", label: "PA" },
  { key: "templePain", label: "SI" },
  { key: "masseterPain", label: "MA" },
  { key: "cervicalPain", label: "CE" },
  { key: "orbitalPain", label: "OR" },
];

function avgPainScore(item: DisplayCheckIn): number {
  const scores = [
    item.eyelidPain,
    item.templePain,
    item.masseterPain,
    item.cervicalPain,
    item.orbitalPain,
  ];
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function CheckInCard({
  item,
  timezone,
}: {
  item: DisplayCheckIn;
  timezone: string;
}) {
  const { label, isMoon } = getTimeOfDay(item.loggedAt, timezone);
  const avg = avgPainScore(item);
  const barPct = avg * 10;

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(212,162,76,0.12)]">
            {isMoon ? (
              <MoonIcon size={15} color="var(--accent)" />
            ) : (
              <SunIcon size={15} color="var(--accent)" />
            )}
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-[var(--text-primary)]">
              {item.triggerType
                ? `Trigger: ${item.triggerType === "other" && item.notes ? item.notes : TRIGGER_LABELS[item.triggerType]}`
                : label}
            </p>
            <p className="mono text-[11px] text-[var(--text-muted)]">
              {formatTime(item.loggedAt, timezone)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          {SCORE_FIELDS.map(({ key, label: fieldLabel }) => {
            const score = item[key] as number;
            return (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <span
                  className="mono text-[15px] font-medium leading-none"
                  style={{ color: painColor(score) }}
                >
                  {score}
                </span>
                <span className="text-[9px] font-medium tracking-[0.08em] text-[var(--text-faint)]">
                  {fieldLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--surface-el)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barPct}%`, background: painColor(avg) }}
          />
        </div>
        <span className="mono text-[11px] text-[var(--text-muted)]">
          {avg.toFixed(2)}/10
        </span>
      </div>

      {item.sleepHours !== null ? (
        <div className="mt-2 flex items-center gap-1.5">
          <MoonIcon size={11} color="var(--text-faint)" />
          <span className="mono text-[10px] text-[var(--text-faint)]">
            {item.sleepHours}h sueño
          </span>
        </div>
      ) : null}
    </article>
  );
}

function TriggerCard({
  item,
  timezone,
}: {
  item: DisplayTriggerGroup;
  timezone: string;
}) {
  const single = item.triggers.length === 1 ? item.triggers[0] : null;
  const maxIntensity = Math.max(...item.triggers.map((t) => t.intensity)) as
    | 1
    | 2
    | 3;
  const iconColor = intensityColor(maxIntensity);
  const time = formatTime(item.loggedAt, timezone);

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      {single ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
              }}
            >
              <LightningIcon size={15} style={{ color: iconColor }} />
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight text-[var(--text-primary)]">
                {single.triggerType === "other"
                  ? ((item as DisplayTriggerGroup & { notes?: string }).notes ??
                    TRIGGER_LABELS[single.triggerType])
                  : TRIGGER_LABELS[single.triggerType]}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Intensidad {single.intensity} · {time}
              </p>
            </div>
          </div>
          <CaretRightIcon size={14} color="var(--text-faint)" />
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
                }}
              >
                <LightningIcon size={15} style={{ color: iconColor }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Triggers
                </p>
                <p className="mono text-[10px] text-[var(--text-muted)]">
                  {time}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1 pl-[42px]">
            {item.triggers.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-primary)]">
                  {TRIGGER_LABELS[t.triggerType]}
                </span>
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: intensityColor(t.intensity) }}
                >
                  Int. {t.intensity}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

function DropCard({ item, timezone }: { item: DisplayDrop; timezone: string }) {
  const time = formatTime(item.loggedAt, timezone);
  const eyeLabel = EYE_LABELS[item.eye].toUpperCase();
  const quantityLabel = `${item.quantity} ${item.quantity === 1 ? "gota" : "gotas"}`;

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(90,78,58,0.25)]">
            <DropIcon size={15} color="var(--text-muted)" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-[var(--text-primary)]">
              {item.name} {quantityLabel}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
              ({eyeLabel}) · {time}
            </p>
          </div>
        </div>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(92,184,90,0.15)]">
          <CheckIcon size={12} color="var(--pain-low)" strokeWidth={2.5} />
        </div>
      </div>
    </article>
  );
}

function SymptomCard({
  item,
  timezone,
}: {
  item: DisplaySymptomGroup;
  timezone: string;
}) {
  const time = formatTime(item.loggedAt, timezone);

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(90,78,58,0.25)]">
          <PulseIcon size={15} color="var(--text-muted)" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">
            Sintomas
          </p>
          <p className="mono text-[10px] text-[var(--text-muted)]">{time}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[42px]">
        {item.symptomTypes.map((type, i) => {
          const label =
            SYMPTOM_OPTIONS.find((o) => o.value === type)?.label ?? type;
          return (
            <span key={i} className="text-[12px] text-[var(--text-muted)]">
              {label}
            </span>
          );
        })}
      </div>
    </article>
  );
}

function renderItem(item: DisplayItem, timezone: string) {
  if (item.kind === "check_in")
    return <CheckInCard item={item} timezone={timezone} />;
  if (item.kind === "drop") return <DropCard item={item} timezone={timezone} />;
  if (item.kind === "trigger_group")
    return <TriggerCard item={item} timezone={timezone} />;
  return <SymptomCard item={item} timezone={timezone} />;
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
    <section>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute bottom-0 left-[15px] top-2 w-px bg-[var(--border)]" />

        <div className="space-y-6">
          {historyFeed.groups.map((group) => {
            const items = collapseEntries(group.entries);
            const pillLabel = getDayPillLabel(
              group.dayKey,
              historyFeed.timezone,
            );
            const shortDate = formatShortDate(group.dayKey);

            return (
              <div key={group.dayKey}>
                {/* Day header */}
                <div className="relative mb-3 flex items-center gap-2 py-1">
                  <span className="relative z-10 inline-flex h-7 items-center rounded-full border border-[var(--border)] bg-[var(--surface-el)] px-3 text-[10px] font-semibold tracking-[0.12em] text-[var(--text-primary)]">
                    {pillLabel ?? shortDate}
                  </span>
                  {pillLabel ? (
                    <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                      {shortDate}
                    </span>
                  ) : null}
                </div>

                {/* Entries */}
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="relative flex items-start gap-3 pl-8"
                    >
                      {/* Timeline dot */}
                      <div
                        className="absolute left-[11px] top-[19px] z-10 h-[9px] w-[9px] rounded-full"
                        style={{
                          background: getDotColor(item),
                          boxShadow: "0 0 0 2px var(--bg)",
                        }}
                      />
                      {/* Card */}
                      <div className="min-w-0 flex-1">
                        {renderItem(item, historyFeed.timezone)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
