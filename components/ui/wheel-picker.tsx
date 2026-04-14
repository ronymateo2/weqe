"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const WHEEL_ROW_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 3;
const WHEEL_PADDING_ROWS = (WHEEL_VISIBLE_ROWS - 1) / 2;
const WHEEL_FADE_HEIGHT = 36;

export type WheelPickerOption = {
  value: string;
  label: string;
  isAction?: boolean;
};

type WheelPickerProps = {
  label?: string;
  options: WheelPickerOption[];
  value: string;
  onChange: (value: string) => void;
  infinite?: boolean;
};

export function WheelPicker({ label, options: baseOptions, value, onChange, infinite }: WheelPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const scrollStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const REPEAT_COUNT = infinite ? 60 : 1;
  const originalLength = baseOptions.length;
  
  const options = useMemo(() => {
    if (!infinite || originalLength === 0) return baseOptions;
    const res: WheelPickerOption[] = [];
    for (let i = 0; i < REPEAT_COUNT; i++) {
      res.push(...baseOptions);
    }
    return res;
  }, [baseOptions, infinite, REPEAT_COUNT, originalLength]);

  useEffect(() => {
    return () => {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = wheelRef.current;
    if (!node || originalLength === 0) return;

    if (!isInitialized.current) {
      isInitialized.current = true;
      const baseIdx = baseOptions.findIndex((opt) => opt.value === value);
      const safeBase = baseIdx === -1 ? 0 : baseIdx;
      const startIndex = infinite ? (Math.floor(REPEAT_COUNT / 2) * originalLength + safeBase) : safeBase;
      const startScroll = startIndex * WHEEL_ROW_HEIGHT;
      // Instant position on mount
      node.style.scrollBehavior = "auto";
      node.scrollTo({ top: startScroll, behavior: "auto" });
      node.style.scrollBehavior = ""; // reset to let css handle smooth snaps later if any
      setActiveIndex(startIndex);
      return;
    }

    const currentVisualIndex = Math.round(node.scrollTop / WHEEL_ROW_HEIGHT);
    const baseIdx = baseOptions.findIndex((opt) => opt.value === value);
    const safeBase = baseIdx === -1 ? 0 : baseIdx;

    let targetIndex = safeBase;
    if (infinite) {
      const currentBase = currentVisualIndex % originalLength;
      let diff = safeBase - currentBase;
      
      // Shortest path around the cycle
      if (Math.abs(diff) > originalLength / 2) {
        diff = diff - Math.sign(diff) * originalLength;
      }
      targetIndex = currentVisualIndex + diff;
      targetIndex = Math.max(0, Math.min(targetIndex, options.length - 1));
    }

    const targetScrollTop = targetIndex * WHEEL_ROW_HEIGHT;
    // Only force a scroll if it's visually meaningful (> 2px)
    if (Math.abs(node.scrollTop - targetScrollTop) > 2) {
      node.scrollTo({ top: targetScrollTop, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      setActiveIndex(targetIndex);
    } else if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
    }
  }, [value, infinite, baseOptions, originalLength, options, activeIndex, REPEAT_COUNT]);

  if (baseOptions.length === 0) return null;

  return (
    <div className="relative rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-2 z-10 rounded-[10px]"
        style={{
          height: `${WHEEL_FADE_HEIGHT}px`,
          background: "linear-gradient(to bottom, rgba(28,24,16,0.96) 0%, rgba(28,24,16,0) 100%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 bottom-2 z-10 rounded-[10px]"
        style={{
          height: `${WHEEL_FADE_HEIGHT}px`,
          background: "linear-gradient(to top, rgba(28,24,16,0.96) 0%, rgba(28,24,16,0) 100%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1/2 z-20 -translate-y-1/2 rounded-[10px] border border-[var(--accent)] bg-[var(--accent-dim)] motion-safe:transition-[top] motion-safe:duration-100 motion-safe:[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
        style={{ height: `${WHEEL_ROW_HEIGHT}px` }}
      />
      <div
        ref={wheelRef}
        aria-label={label}
        className="wheel-picker relative snap-y snap-mandatory overflow-y-auto overscroll-contain bg-transparent"
        role="listbox"
        style={{ height: `${WHEEL_VISIBLE_ROWS * WHEEL_ROW_HEIGHT}px` }}
        onScroll={(event) => {
          const nextIndex = Math.min(
            Math.max(Math.round(event.currentTarget.scrollTop / WHEEL_ROW_HEIGHT), 0),
            options.length - 1
          );
          if (nextIndex !== activeIndex) {
             setActiveIndex(nextIndex);
          }

          if (scrollStopTimeoutRef.current) {
            clearTimeout(scrollStopTimeoutRef.current);
          }

          scrollStopTimeoutRef.current = setTimeout(() => {
            const finalIndex = Math.min(
              Math.max(Math.round((wheelRef.current?.scrollTop || 0) / WHEEL_ROW_HEIGHT), 0),
              options.length - 1
            );
            onChange(options[finalIndex].value);
          }, 120);
        }}
      >
        <div aria-hidden style={{ height: `${WHEEL_PADDING_ROWS * WHEEL_ROW_HEIGHT}px` }} />
        {options.map((option, index) => {
          const isSelected = index === activeIndex;
          const key = infinite ? `${option.value}-${index}` : option.value;
          return (
            <button
              key={key}
              aria-selected={isSelected}
              className={cn(
                "block w-full snap-center rounded-[10px] border border-transparent px-4 text-center text-[15px] font-medium transition-[color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97] motion-safe:active:transition-none",
                option.isAction
                  ? isSelected
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-faint)]"
                  : isSelected
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              )}
              style={{ height: `${WHEEL_ROW_HEIGHT}px` }}
              role="option"
              type="button"
              onClick={() => {
                const node = wheelRef.current;
                if (node) {
                  node.scrollTo({ top: index * WHEEL_ROW_HEIGHT, behavior: prefersReducedMotion() ? "auto" : "smooth" });
                }
                onChange(options[index].value);
              }}
            >
              {option.label}
            </button>
          );
        })}
        <div aria-hidden style={{ height: `${WHEEL_PADDING_ROWS * WHEEL_ROW_HEIGHT}px` }} />
      </div>
    </div>
  );
}
