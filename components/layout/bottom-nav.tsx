"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, ClipboardPlus, FileText, History } from "lucide-react";
import { APP_TABS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const icons = {
  "/register": ClipboardPlus,
  "/history": History,
  "/dashboard": ChartLine,
  "/report": FileText
} as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navegacion principal">
      <div className="bottom-nav__inner">
        {APP_TABS.map((tab) => {
          const Icon = icons[tab.href];
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              className={cn(
                "flex min-h-[72px] flex-col items-center justify-center gap-1 text-[10px] font-medium",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
              href={tab.href}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
