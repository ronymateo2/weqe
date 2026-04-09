import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileScreen } from "@/components/forms/profile-screen";
import { ScreenHeader } from "@/components/layout/screen-header";
import { getMedicationsAction } from "@/lib/actions/medications";
import { getUserTimezoneAction } from "@/lib/actions/user-settings";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fprofile");
  }

  const [medsResult, tzResult] = await Promise.all([
    getMedicationsAction(),
    getUserTimezoneAction()
  ]);

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="Tu información y medicamentos actuales."
        title="Perfil"
        user={session.user}
      />
      <ProfileScreen
        initialErrorMessage={medsResult.ok ? undefined : medsResult.message}
        initialMedications={medsResult.medications}
        initialTimezone={tzResult.timezone}
        user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
      />
    </section>
  );
}
