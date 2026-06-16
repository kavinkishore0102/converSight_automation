import Link from "next/link";

export default function PublicAutomationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/automations" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-soft transition-transform group-hover:scale-105">
              CS
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-ink-900">ConverSight</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-400">
                Automation Portal
              </div>
            </div>
          </Link>
          <div className="text-xs text-ink-400 hidden sm:block">
            Pick an automation, fill it in, get it done.
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">
        ConverSight Automation · Built for the team
      </footer>
    </div>
  );
}
