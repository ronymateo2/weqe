"use client";

import { useMemo } from "react";
import { WheelPicker } from "@/components/ui/wheel-picker";
import type { WheelPickerOption } from "@/components/ui/wheel-picker";

type Props = {
  /** ISO datetime string */
  value: string;
  onChange: (isoValue: string) => void;
  /** Upper bound — defaults to now */
  max?: Date;
};

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseParts(iso: string) {
  const d = new Date(iso);
  const rawMinute = d.getMinutes();
  const snappedMinute = Math.min(55, Math.round(rawMinute / 5) * 5);
  return {
    dayKey: toDateKey(d),
    hour: String(d.getHours()).padStart(2, "0"),
    minute: String(snappedMinute).padStart(2, "0"),
  };
}

function buildISO(dayKey: string, hour: string, minute: string, max: Date): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const d = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0);
  return (d > max ? max : d).toISOString();
}

export function DateTimeWheelPicker({ value, onChange, max }: Props) {
  const ceiling = max ?? new Date();
  const { dayKey, hour, minute } = parseParts(value);

  const dayOptions: WheelPickerOption[] = useMemo(() => {
    const opts: WheelPickerOption[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ceiling);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      let label: string;
      if (i === 0) label = "Hoy";
      else if (i === 1) label = "Ayer";
      else
        label = d.toLocaleDateString("es-CO", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
      opts.push({ value: key, label });
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toDateKey(ceiling)]);

  const hourOptions: WheelPickerOption[] = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        value: String(i).padStart(2, "0"),
        label: String(i).padStart(2, "0"),
      })),
    [],
  );

  const minuteOptions: WheelPickerOption[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i * 5).padStart(2, "0"),
        label: String(i * 5).padStart(2, "0"),
      })),
    [],
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1.5">
        <p className="section-label text-center">Día</p>
        <WheelPicker
          label="Día"
          options={dayOptions}
          value={dayKey}
          onChange={(v) => onChange(buildISO(v, hour, minute, ceiling))}
        />
      </div>
      <div className="space-y-1.5">
        <p className="section-label text-center">Hora</p>
        <WheelPicker
          label="Hora"
          options={hourOptions}
          value={hour}
          onChange={(v) => onChange(buildISO(dayKey, v, minute, ceiling))}
          infinite
        />
      </div>
      <div className="space-y-1.5">
        <p className="section-label text-center">Min</p>
        <WheelPicker
          label="Minutos"
          options={minuteOptions}
          value={minute}
          onChange={(v) => onChange(buildISO(dayKey, hour, v, ceiling))}
          infinite
        />
      </div>
    </div>
  );
}
