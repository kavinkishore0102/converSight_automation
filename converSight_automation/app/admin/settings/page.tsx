import PageHeader from "@/components/page-header";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";

export default async function Settings() {
  const session = (await getSession())!;
  const db = readDb();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Settings" subtitle="Workspace and account settings." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-400">Workspace</div>
          <div className="mt-1 font-semibold">ConverSight Automation</div>
          <div className="mt-3 text-xs text-slate-500">
            {db.users.length} user{db.users.length === 1 ? "" : "s"} · {db.automations.length} automation{db.automations.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-400">Signed in as</div>
          <div className="mt-1 font-semibold">{session.name}</div>
          <div className="mt-1 text-xs text-slate-500">{session.email}</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-brand-400">{session.role}</div>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="font-semibold">Users</h3>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {db.users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-slate-300">{u.email}</td>
                <td className="py-2">
                  <span className={`badge ${u.role === "admin" ? "badge-approved" : "badge-in-progress"}`}>
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
