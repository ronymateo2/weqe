"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingQuickActions } from "@/components/layout/floating-quick-actions";

export function AppShell({
  children,
  isAuthenticated
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <div className="app-shell">
      <main className="app-frame">{children}</main>
      {isAuthenticated ? (
        <>
          <FloatingQuickActions />
          <BottomNav />
        </>
      ) : null}
    </div>
  );
}
