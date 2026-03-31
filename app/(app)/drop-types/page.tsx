import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DropTypesScreen } from "@/components/forms/drop-types-screen";
import { ScreenHeader } from "@/components/layout/screen-header";
import { getDropTypesAction } from "@/lib/actions/drops";

export default async function DropTypesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fdrop-types");
  }

  const result = await getDropTypesAction();

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="Guarda tus gotas frecuentes una sola vez y luego seleccionalas rapido al registrar aplicaciones."
        title="Tipos de gota"
        user={session.user}
      />
      <DropTypesScreen
        initialDropTypes={result.ok ? result.dropTypes : []}
        initialErrorMessage={result.ok ? undefined : result.message}
      />
    </section>
  );
}
