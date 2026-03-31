import { auth } from "@/auth";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScreenHeader } from "@/components/layout/screen-header";
import { getDashboardDataAction } from "@/lib/actions/dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fdashboard");
  }

  const dashboardData = await getDashboardDataAction();

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="Las correlaciones importan mas que las entradas aisladas. Aqui veremos patrones de dolor, sueno y triggers."
        title="Dashboard"
        user={session.user}
      />
      <DashboardScreen dashboardData={dashboardData} />
    </section>
  );
}
