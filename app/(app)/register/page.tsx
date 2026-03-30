import { auth, signIn } from "@/auth";
import { CheckInForm } from "@/components/forms/check-in-form";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";

export default async function RegisterPage() {
  const session = await auth();

  return (
    <section>
      <ScreenHeader
        description="Registra dolor y sueno con el minimo esfuerzo posible, incluso en un mal dia."
        title="Registro rapido"
      />

      {!session?.user ? (
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-5">
          <StatusBanner
            message="La base del flujo ya esta lista. Para guardar datos reales falta completar AUTH_POSTGRES_URL y SUPABASE_SERVICE_ROLE_KEY. En local, deja AUTH_URL vacio para que Google OAuth use el origen real del servidor; en produccion si debe apuntar al dominio publicado."
            tone="info"
          />
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button className="w-full" type="submit">
              Continuar con Google
            </Button>
          </form>
        </div>
      ) : (
        <CheckInForm />
      )}
    </section>
  );
}
