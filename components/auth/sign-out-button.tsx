import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/register" });
      }}
    >
      <Button className="px-4 text-[13px]" type="submit" variant="ghost">
        Cerrar sesion
      </Button>
    </form>
  );
}
