"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const uid = useId();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      <p className="section-label">{label}</p>
      <div
        className="grid min-h-12 gap-2 rounded-[999px] border border-[var(--border)] bg-[var(--surface)] p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "relative min-h-12 select-none rounded-[999px] px-4 text-[13px] font-medium",
                isActive
                  ? "text-[#121008]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
              style={{
                transform: isActive ? "scale(1.02)" : "scale(1)",
                transition: `color 200ms ${EASING}, transform 120ms ease-out`,
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = "scale(0.94)";
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = isActive
                  ? "scale(1.02)"
                  : "scale(1)";
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = isActive
                  ? "scale(1.02)"
                  : "scale(1)";
              }}
              onClick={() => onChange(option.value)}
            >
              {isActive && (
                <motion.div
                  layoutId={`${uid}-indicator`}
                  aria-hidden
                  className="absolute inset-0 rounded-[999px] bg-[var(--accent)]"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 10px rgba(0,0,0,0.28)",
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", duration: 0.4, bounce: 0.12 }
                  }
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
