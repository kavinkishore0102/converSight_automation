import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  return (
    <AppShell role="user" name={session.name} email={session.email}>
      {children}
    </AppShell>
  );
}
