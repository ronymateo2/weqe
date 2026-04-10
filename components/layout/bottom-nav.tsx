"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineIcon,
  ClipboardIcon,
  FileTextIcon,
  ClockCounterClockwiseIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { APP_TABS } from "@/lib/constants";

const icons = {
  "/register": ClipboardIcon,
  "/history": ClockCounterClockwiseIcon,
  "/dashboard": ChartLineIcon,
  "/report": FileTextIcon,
  "/profile": UserIcon,
} as const;

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = APP_TABS.findIndex((tab) =>
    pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeTab = APP_TABS[safeActiveIndex];
  const ActiveIcon = icons[activeTab.href];
  const navStyle = {
    "--active-index": String(safeActiveIndex),
    "--tab-count": String(APP_TABS.length),
  } as CSSProperties;

  return (
    <nav className="bottom-nav" aria-label="Navegacion principal">
      <div className="bottom-nav__inner">
        <div className="bottom-nav__rail" style={navStyle}>
          <span className="bottom-nav__notch" aria-hidden />
          <span className="bottom-nav__orb" aria-hidden>
            <ActiveIcon size={22} weight="fill" />
          </span>

          {APP_TABS.map((tab, index) => {
            const Icon = icons[tab.href];
            const isActive = index === safeActiveIndex;

            return (
              <Link
                key={tab.href}
                aria-current={isActive ? "page" : undefined}
                className="bottom-nav__item"
                data-active={isActive ? "true" : "false"}
                href={tab.href}
              >
                <span className="bottom-nav__icon" aria-hidden>
                  <Icon size={22} weight={isActive ? "bold" : "regular"} />
                </span>
                <span className="bottom-nav__label">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
