"use client";

import { useCallback, useRef } from "react";
import { painColor, painGradient, qualityColor, qualityGradient } from "@/lib/pain";

type PainSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  variant?: "pain" | "quality";
};

export function PainSlider({ label, value, onChange, variant = "pain" }: PainSliderProps) {
  const colorFn = variant === "quality" ? qualityColor : painColor;
  const gradientFn = variant === "quality" ? qualityGradient : painGradient;
  const trackRef = useRef<HTMLDivElement>(null);

  const valueFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * 10);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = valueFromX(event.clientX);
    if (next !== null) onChange(next);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = valueFromX(event.clientX);
    if (next !== null) onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="mono text-[22px] font-light" style={{ color: colorFn(value) }}>
          {value}
        </span>
      </div>

      {/* Large draggable track — entire area is the touch target */}
      <div
        ref={trackRef}
        aria-label={label}
        aria-valuemax={10}
        aria-valuemin={0}
        aria-valuenow={value}
        className="relative cursor-pointer select-none touch-none rounded-[16px] border border-[var(--border)]"
        role="slider"
        style={{ height: 68, background: gradientFn(value) }}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(10, value + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, value - 1));
        }}
      >
      </div>
    </div>
  );
}
