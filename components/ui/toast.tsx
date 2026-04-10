"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
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
    const frame = requestAnimationFrame(() => setVisible(true));

    if (tone === "success") {
      timerRef.current = setTimeout(() => setVisible(false), 4000);
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

  const handleDismiss = () => setVisible(false);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 px-4 pt-[env(safe-area-inset-top)]",
        "transition-[transform,opacity] duration-300 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      )}
      style={{
        transitionTimingFunction: visible
          ? "var(--ease-out)"
          : "cubic-bezier(0.4, 0, 1, 1)",
        willChange: "transform, opacity",
      }}
    >
      <div
        className={cn(
          "mx-auto mt-3 flex max-w-[480px] items-start gap-3 rounded-[10px] px-4 py-3",
          "text-[13px] font-medium leading-snug text-[var(--text-primary)]",
          tone === "success" && "bg-[var(--success)]",
          tone === "error" && "bg-[var(--error)]",
        )}
      >
        <span className="flex-1">{message}</span>
        {tone === "error" && (
          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={handleDismiss}
            className="mt-px shrink-0 opacity-70 transition-opacity duration-150 hover:opacity-100"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
