"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingQuickActions } from "@/components/layout/floating-quick-actions";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-frame">{children}</main>
      <FloatingQuickActions />
      <BottomNav />
    </div>
  );
}
