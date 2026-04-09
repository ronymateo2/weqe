import { Suspense } from "react";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScreenHeader } from "@/components/layout/screen-header";
import { HistoryScreen } from "@/components/history/history-screen";
import { getHistoryFeedAction } from "@/lib/actions/history";
import { redirect } from "next/navigation";
import { DayGroupSkeleton } from "@/components/ui/day-group-skeleton";

async function HistoryFeed() {
  const historyFeed = await getHistoryFeedAction();
  return <HistoryScreen historyFeed={historyFeed} />;
}

function HistoryFeedSkeleton() {
  return (
    <section className="space-y-8">
      <DayGroupSkeleton entries={["checkin", "slim", "slim"]} />
      <DayGroupSkeleton entries={["checkin", "slim"]} />
      <DayGroupSkeleton entries={["slim", "checkin"]} />
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
