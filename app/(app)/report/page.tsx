import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScreenHeader } from "@/components/layout/screen-header";
import { ReportScreen } from "@/components/report/report-screen";
import { getReportDataAction } from "@/lib/actions/report";
import { redirect } from "next/navigation";

export default async function ReportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/register?from=%2Freport");
  }

  const data = await getReportDataAction();

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="Preparamos un resumen claro para consulta medica y exportacion PDF."
        title="Reporte"
        user={session.user}
      />
      <ReportScreen data={data} />
    </section>
  );
}
