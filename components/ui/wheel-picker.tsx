"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
};

export function WheelPicker({ label, options, value, onChange }: WheelPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const scrollStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const effectiveSelectedIndex = selectedIndex === -1 ? 0 : selectedIndex;
  const activeIndex = previewIndex ?? effectiveSelectedIndex;

  useEffect(() => {
    const node = wheelRef.current;
    if (!node) return;
    const nextScrollTop = effectiveSelectedIndex * WHEEL_ROW_HEIGHT;
    if (Math.abs(node.scrollTop - nextScrollTop) < 2) return;
    node.scrollTo({ top: nextScrollTop, behavior: "auto" });
  }, [effectiveSelectedIndex]);

  useEffect(() => {
    return () => {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
    };
  }, []);

  if (options.length === 0) return null;

  const commitIndex = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), options.length - 1);
    onChange(options[clamped].value);
  };

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
        className="pointer-events-none absolute inset-x-2 top-1/2 z-20 -translate-y-1/2 rounded-[10px] border border-[var(--accent)] bg-[var(--accent-dim)]"
        style={{ height: `${WHEEL_ROW_HEIGHT}px` }}
      />
      <div
        ref={wheelRef}
        aria-label={label}
        className="wheel-picker relative snap-y snap-mandatory overflow-y-auto overscroll-contain"
        role="listbox"
        style={{ height: `${WHEEL_VISIBLE_ROWS * WHEEL_ROW_HEIGHT}px` }}
        onScroll={(event) => {
          const nextIndex = Math.min(
            Math.max(Math.round(event.currentTarget.scrollTop / WHEEL_ROW_HEIGHT), 0),
            options.length - 1
          );
          setPreviewIndex(nextIndex);

          if (scrollStopTimeoutRef.current) {
            clearTimeout(scrollStopTimeoutRef.current);
          }

          scrollStopTimeoutRef.current = setTimeout(() => {
            setPreviewIndex(null);
            commitIndex(nextIndex);
          }, 120);
        }}
      >
        <div aria-hidden style={{ height: `${WHEEL_PADDING_ROWS * WHEEL_ROW_HEIGHT}px` }} />
        {options.map((option, index) => {
          const isSelected = index === activeIndex;
          return (
            <button
              key={option.value}
              aria-selected={isSelected}
              className={cn(
                "block w-full snap-center rounded-[10px] border border-transparent px-4 text-center text-[15px] font-medium transition-colors",
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
                  node.scrollTo({ top: index * WHEEL_ROW_HEIGHT, behavior: "smooth" });
                }
                commitIndex(index);
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
