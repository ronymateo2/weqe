"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingQuickActions } from "@/components/layout/floating-quick-actions";
import { useOfflineSync } from "@/lib/hooks/use-offline-sync";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";

function NetworkBanner() {
  const { pendingCount, isSyncing } = useOfflineSync();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const hidden = isOnline && pendingCount === 0;
  if (hidden) return null;

  let dot = <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-muted)" }} />;
  let label = "Sin conexión";

  if (!isOnline && pendingCount > 0) {
    label = `Sin conexión · ${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`;
  } else if (isOnline && isSyncing) {
    dot = <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "var(--accent)" }} />;
    label = "Sincronizando...";
  } else if (isOnline && pendingCount > 0) {
    label = `${pendingCount} registro${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""}`;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2"
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
    >
      {dot}
      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function PullToRefreshIndicator() {
  const { pullDistance, refreshing, threshold } = usePullToRefresh();

  if (!refreshing && pullDistance === 0) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const opacity = 0.3 + progress * 0.7;

  return (
    <div
      className="fixed left-0 right-0 z-[60] flex items-center justify-center"
      style={{
        top: 0,
        height: 48,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        pointerEvents: "none",
      }}
    >
      {refreshing ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ animation: "ptr-spin 0.8s linear infinite" }}
        >
          <circle cx="10" cy="10" r="8" stroke="var(--border)" strokeWidth="2" />
          <path
            d="M10 2a8 8 0 0 1 8 8"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            transform: `rotate(${rotation}deg)`,
            opacity,
            transition: "none",
          }}
        >
          <path
            d="M10 3v11M10 14l-4-4M10 14l4-4"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export function AppShell({
  children,
  isAuthenticated
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <div className="app-shell">
      <PullToRefreshIndicator />
      {isAuthenticated ? <NetworkBanner /> : null}
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
