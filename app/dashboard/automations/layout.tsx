import Link from "next/link";

export default function PublicAutomationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard/automations" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/30 transition-transform group-hover:scale-105">
              CS
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">ConverSight</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Automation Portal
              </div>
            </div>
          </Link>
          <div className="text-xs text-slate-500 hidden sm:block">
            Pick an automation, fill it in, get it done.
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        ConverSight Automation · Built for the team
      </footer>
    </div>
  );
}
