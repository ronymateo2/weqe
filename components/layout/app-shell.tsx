"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingQuickActions } from "@/components/layout/floating-quick-actions";
import { useOfflineSync } from "@/lib/hooks/use-offline-sync";

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

  let dot = (
    <span
      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
      style={{ background: "var(--text-muted)" }}
    />
  );
  let label = "Sin conexión";

  if (!isOnline && pendingCount > 0) {
    label = `Sin conexión · ${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`;
  } else if (isOnline && isSyncing) {
    dot = (
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: "var(--accent)" }}
      />
    );
    label = "Sincronizando...";
  } else if (isOnline && pendingCount > 0) {
    label = `${pendingCount} registro${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""}`;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {dot}
      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
    </div>
  );
}

export function AppShell({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <div className="app-shell">
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
