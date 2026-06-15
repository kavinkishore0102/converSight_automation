"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Nav = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

const adminNav: Nav[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Automations", href: "/admin/automations", icon: Workflow },
  { label: "Requests", href: "/admin/requests", icon: ListChecks },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const userNav: Nav[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Automations", href: "/dashboard/automations", icon: Workflow },
  { label: "My Requests", href: "/dashboard/requests", icon: ListChecks },
];

export default function AppShell({
  children,
  role,
  name,
  email,
}: {
  children: React.ReactNode;
  role: "admin" | "user";
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : userNav;
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/80 backdrop-blur-md flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href={role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/30">
              CS
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">ConverSight</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Automation
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-500">
            {role === "admin" ? "Administration" : "Workspace"}
          </div>
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{name}</div>
                <div className="text-[11px] text-slate-500 truncate">{email}</div>
              </div>
            </div>
            <button onClick={logout} className="mt-3 w-full btn-ghost text-xs justify-start px-2 py-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                placeholder="Search automations, requests…"
                className="input pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost h-9 w-9 p-0 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-800 transition"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold">
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-sm hidden sm:block">{name}</div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-900 shadow-xl py-1 z-50"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="text-sm">{name}</div>
                    <div className="text-xs text-slate-500">{email}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-brand-400">
                      {role}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
