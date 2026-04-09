import { Suspense } from "react";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScreenHeader } from "@/components/layout/screen-header";
import { HistoryScreen } from "@/components/history/history-screen";
import { getHistoryFeedAction } from "@/lib/actions/history";
import { redirect } from "next/navigation";

async function HistoryFeed() {
  const historyFeed = await getHistoryFeedAction();
  return <HistoryScreen historyFeed={historyFeed} />;
}

function HistoryFeedSkeleton() {
  return (
    <section className="space-y-8">
      {[
        ["checkin", "slim", "slim"],
        ["checkin", "slim"],
        ["slim", "checkin"],
      ].map((group, i) => (
        <div key={i}>
          <div className="skeleton mb-3 h-7 w-16 rounded-full" />
          <div className="space-y-2.5">
            {group.map((type, j) =>
              type === "checkin" ? (
                <div
                  key={j}
                  className="skeleton h-[88px] rounded-[14px]"
                />
              ) : (
                <div key={j} className="skeleton h-[52px] rounded-[14px]" />
              ),
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fhistory");
  }

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="El historial agrupa check-ins, gotas y triggers por dia para revisar contexto clinico rapido."
        title="Historial"
        user={session.user}
      />
      <Suspense fallback={<HistoryFeedSkeleton />}>
        <HistoryFeed />
      </Suspense>
    </section>
  );
}
