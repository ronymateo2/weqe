import { cn } from "@/lib/utils";

type StatusBannerProps = {
  tone: "info" | "success" | "error";
  message: string;
};

export function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-4 py-3 text-[13px] font-medium",
        tone === "info" && "border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--text-primary)]",
        tone === "success" && "border-transparent bg-[var(--success)] text-[var(--bg)]",
        tone === "error" && "border-transparent bg-[var(--error)] text-[var(--text-primary)]"
      )}
    >
      {message}
    </div>
  );
}
