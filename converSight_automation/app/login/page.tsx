import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect(s.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/30">
            CS
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">ConverSight</div>
            <div className="text-xs text-slate-400 -mt-0.5">Automation Console</div>
          </div>
        </div>

        <div className="card p-7">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400 mt-1">
            Use your ConverSight credentials to continue.
          </p>

          <LoginForm />

          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Demo credentials
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                <div className="font-medium text-brand-300">Admin</div>
                <div className="text-slate-400 mt-1">admin@conversight.ai</div>
                <div className="text-slate-500">admin123</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                <div className="font-medium text-sky-300">User</div>
                <div className="text-slate-400 mt-1">user@conversight.ai</div>
                <div className="text-slate-500">user123</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} ConverSight.ai · Automation Console
        </p>
      </div>
    </div>
  );
}
