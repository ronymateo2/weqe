"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  tone: "success" | "error";
  message: string;
  onDismiss: () => void;
};

export function Toast({ tone, message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter transition on next frame
    const frame = requestAnimationFrame(() => setVisible(true));

    if (tone === "success") {
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 4000);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tone]);

  // After exit transition ends, notify parent to unmount
  const handleTransitionEnd = () => {
    if (!visible) onDismiss();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 px-4 pt-[env(safe-area-inset-top)]",
        "transition-[transform,opacity] duration-300",
        "motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      )}
      style={{ willChange: "transform, opacity" }}
    >
      <div
        className={cn(
          "mx-auto mt-3 max-w-[480px] rounded-[10px] px-4 py-3 text-[13px] font-medium text-[var(--bg)]",
          tone === "success" && "bg-[var(--success)]",
          tone === "error" && "bg-[var(--error)] text-[var(--text-primary)]"
        )}
      >
        {message}
      </div>
    </div>
  );
}
