import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppGroupLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return <AppShell isAuthenticated={Boolean(session?.user)}>{children}</AppShell>;
}
