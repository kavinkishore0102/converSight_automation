"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Power } from "lucide-react";

export default function AutomationActions({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    router.refresh();
    setLoading(false);
  }

  async function remove() {
    if (!confirm("Delete this automation? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        title={enabled ? "Disable" : "Enable"}
        className="btn-ghost h-8 w-8 p-0"
      >
        <Power className={`h-3.5 w-3.5 ${enabled ? "text-brand-400" : "text-slate-500"}`} />
      </button>
      <Link
        href={`/admin/automations/${id}`}
        title="Edit"
        className="btn-ghost h-8 w-8 p-0"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={remove}
        disabled={loading}
        title="Delete"
        className="btn-ghost h-8 w-8 p-0 hover:text-rose-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
