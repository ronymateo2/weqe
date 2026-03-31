import { auth, signIn } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CheckInForm } from "@/components/forms/check-in-form";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { env } from "@/lib/env";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const AUTH_REDIRECT_ROUTES = ["/register", "/history", "/dashboard", "/report"] as const;

function getSafeRedirect(path: string | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/register";
  }

  const isAllowed = AUTH_REDIRECT_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

  return isAllowed ? path : "/register";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedFromParam = resolvedParams.from;
  const requestedFrom = Array.isArray(requestedFromParam) ? requestedFromParam[0] : requestedFromParam;
  const redirectTo = getSafeRedirect(requestedFrom);
  const canSignInWithGoogle = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return (
    <section>
      <ScreenHeader
        action={session?.user ? <SignOutButton /> : undefined}
        description="Registra dolor y sueno con el minimo esfuerzo posible, incluso en un mal dia."
        title="Registro rapido"
        user={session?.user}
      />

      {!session?.user ? (
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-5">
          {canSignInWithGoogle ? (
            <>
              <StatusBanner message="Para continuar, primero inicia sesion con Google." tone="info" />
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo });
                }}
              >
                <Button className="w-full" type="submit">
                  Iniciar sesion con Google
                </Button>
              </form>
            </>
          ) : (
            <StatusBanner
              message="Google Sign-In aun no esta configurado. Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET para habilitar el login."
              tone="info"
            />
          )}
        </div>
      ) : (
        <CheckInForm />
      )}
    </section>
  );
}
