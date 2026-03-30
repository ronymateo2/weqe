import { cn } from "@/lib/utils";

type TriggerChipProps = {
  label: string;
  intensity: 0 | 1 | 2 | 3;
  onClick: () => void;
};

const styles: Record<number, string> = {
  0: "border-[var(--border)] bg-transparent text-[var(--text-muted)]",
  1: "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]",
  2: "border-[var(--warning)] bg-[rgba(224,147,42,0.12)] text-[var(--warning)]",
  3: "border-[var(--error)] bg-[rgba(204,63,48,0.12)] text-[var(--error)]"
};

export function TriggerChip({ label, intensity, onClick }: TriggerChipProps) {
  const suffix = intensity > 0 ? String.fromCharCode(9311 + intensity) : "";

  return (
    <button
      type="button"
      className={cn(
        "min-h-12 rounded-[999px] border px-4 py-2 text-[13px] font-medium transition-colors",
        styles[intensity]
      )}
      onClick={onClick}
    >
      {label}
      {suffix ? ` ${suffix}` : ""}
    </button>
  );
}
