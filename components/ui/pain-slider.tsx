"use client";

import { painColor, painGradient } from "@/lib/pain";

type PainSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function PainSlider({ label, value, onChange }: PainSliderProps) {
  return (
    <label className="block space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        <span
          className="mono text-[22px] font-light"
          style={{
            color: painColor(value)
          }}
        >
          {value}
        </span>
      </div>
      <div className="min-h-12 rounded-[999px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <input
          aria-label={label}
          className="h-4 w-full appearance-none rounded-[999px] outline-none"
          max={10}
          min={0}
          step={1}
          style={{
            background: painGradient(value)
          }}
          type="range"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </label>
  );
}
