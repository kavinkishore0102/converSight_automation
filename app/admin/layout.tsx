import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  return (
    <AppShell role="admin" name={session.name} email={session.email}>
      {children}
    </AppShell>
  );
}
