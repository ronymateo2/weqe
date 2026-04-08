import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileScreen } from "@/components/forms/profile-screen";
import { ScreenHeader } from "@/components/layout/screen-header";
import { getMedicationsAction } from "@/lib/actions/medications";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?from=%2Fprofile");
  }

  const result = await getMedicationsAction();

  return (
    <section>
      <ScreenHeader
        action={<SignOutButton />}
        description="Tu información y medicamentos actuales."
        title="Perfil"
        user={session.user}
      />
      <ProfileScreen
        initialErrorMessage={result.ok ? undefined : result.message}
        initialMedications={result.medications}
        user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
      />
    </section>
  );
}
