import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScreenHeader } from "@/components/layout/screen-header";
import { HistoryScreen } from "@/components/history/history-screen";
import { getHistoryFeedAction } from "@/lib/actions/history";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fhistory");
  }

  const historyFeed = await getHistoryFeedAction();

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="El historial agrupa check-ins, gotas y triggers por dia para revisar contexto clinico rapido."
        title="Historial"
        user={session.user}
      />
      <HistoryScreen historyFeed={historyFeed} />
    </section>
  );
}
