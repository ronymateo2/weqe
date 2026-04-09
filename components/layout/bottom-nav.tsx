"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineIcon,
  ClipboardTextIcon,
  FileTextIcon,
  ClockCounterClockwiseIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { APP_TABS } from "@/lib/constants";

const icons = {
  "/register": ClipboardTextIcon,
  "/history": ClockCounterClockwiseIcon,
  "/dashboard": ChartLineIcon,
  "/report": FileTextIcon,
  "/profile": UserCircleIcon,
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
              className="flex min-h-[72px] flex-col items-center justify-center gap-1 text-[10px] font-medium"
              style={{
                color: isActive ? "var(--accent-bright)" : "var(--text-muted)",
              }}
              href={tab.href}
            >
              <Icon size={22} weight={isActive ? "bold" : "regular"} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
