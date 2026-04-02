"use client";

import { painColor, qualityColor, painGradient, qualityGradient } from "@/lib/pain";

type PainSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  variant?: "pain" | "quality";
};

export function PainSlider({
  label,
  value,
  onChange,
  variant = "pain",
}: PainSliderProps) {
  const colorFn = variant === "quality" ? qualityColor : painColor;
  const gradientFn = variant === "quality" ? qualityGradient : painGradient;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">
          {label}
        </span>
        <span
          className="mono text-[22px] font-light"
          style={{ color: colorFn(value) }}
        >
          {value}
        </span>
      </div>
      <input
        aria-label={label}
        aria-valuemax={10}
        aria-valuemin={0}
        aria-valuenow={value}
        className="pain-range"
        max={10}
        min={0}
        style={{ "--track-bg": gradientFn(value) } as React.CSSProperties}
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
