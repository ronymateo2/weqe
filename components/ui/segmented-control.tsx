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

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange
}: SegmentedControlProps<T>) {
  return (
    <div className="space-y-3">
      <p className="section-label">{label}</p>
      <div className="grid min-h-12 grid-cols-3 gap-2 rounded-[999px] border border-[var(--border)] bg-[var(--surface)] p-1">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "min-h-12 rounded-[999px] px-4 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[#121008]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-el)] hover:text-[var(--text-primary)]"
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
