import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-[999px] border px-5 py-3 text-[15px] font-medium transition-colors",
        variant === "primary" &&
          "border-transparent bg-[var(--accent)] text-[#121008] hover:bg-[var(--accent-bright)] disabled:opacity-50",
        variant === "ghost" &&
          "border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-el)]",
        variant === "subtle" &&
          "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-el)]",
        "disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
