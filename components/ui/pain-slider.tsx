"use client";

import { useCallback, useRef } from "react";
import { painColor, qualityColor } from "@/lib/pain";

type PainSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  variant?: "pain" | "quality";
};

// Static full-range gradients — drawn at 100% width, clipped to reveal amount
const PAIN_FILL = "linear-gradient(to right, #5cb85a, #e0932a 45%, #cc3f30)";
const QUALITY_FILL = "linear-gradient(to right, #cc3f30, #e0932a 45%, #5cb85a)";

export function PainSlider({
  label,
  value,
  onChange,
  variant = "pain",
}: PainSliderProps) {
  const colorFn = variant === "quality" ? qualityColor : painColor;
  const fillGradient = variant === "quality" ? QUALITY_FILL : PAIN_FILL;
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

  const clipRight = 100 - value * 10;

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

      {/* Track — 68px touch target, full area is draggable */}
      <div
        ref={trackRef}
        aria-label={label}
        aria-valuemax={10}
        aria-valuemin={0}
        aria-valuenow={value}
        className="relative cursor-pointer select-none touch-none overflow-hidden rounded-[16px] border border-[var(--border)]"
        role="slider"
        style={{ height: 40, background: "var(--surface)" }}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp")
            onChange(Math.min(10, value + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown")
            onChange(Math.max(0, value - 1));
        }}
      >
        {/*
          Full-width gradient div clipped from the right.
          clip-path transitions smoothly — no gradient recomputation on each frame.
          Colors stay anchored to their position on the 0–10 scale.
        */}
        <div
          className="absolute inset-0"
          style={{
            background: fillGradient,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            transition: "clip-path 90ms linear",
          }}
        />
      </div>
    </div>
  );
}
