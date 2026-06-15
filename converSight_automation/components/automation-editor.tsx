"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2, GripVertical } from "lucide-react";
import { Automation, AutomationField, FieldType } from "@/lib/db";
import { uid } from "@/lib/utils";

const CATEGORIES = [
  "Dataset",
  "Session",
  "Insights",
  "Scheduler",
  "Feature Flag",
  "Admin",
  "Security",
  "Other",
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
];

export default function AutomationEditor({ automation }: { automation?: Automation }) {
  const router = useRouter();
  const isEdit = !!automation;

  const [name, setName] = useState(automation?.name ?? "");
  const [category, setCategory] = useState(automation?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(automation?.description ?? "");
  const [enabled, setEnabled] = useState(automation?.enabled ?? true);
  const [fields, setFields] = useState<AutomationField[]>(automation?.fields ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addField() {
    setFields((f) => [
      ...f,
      { id: uid("f"), label: "New Field", type: "text", required: false },
    ]);
  }

  function updateField(id: string, patch: Partial<AutomationField>) {
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removeField(id: string) {
    setFields((f) => f.filter((x) => x.id !== id));
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields((f) => {
      const i = f.findIndex((x) => x.id === id);
      if (i < 0) return f;
      const j = i + dir;
      if (j < 0 || j >= f.length) return f;
      const next = [...f];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const url = isEdit ? `/api/automations/${automation!.id}` : "/api/automations";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, enabled, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/admin/automations");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Basics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Name <span className="text-rose-400">*</span></label>
            <input
              className="input"
              placeholder="e.g. Activate Dataset"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-700 bg-slate-900 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500 focus:ring-brand-500"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled and visible to users
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="What does this automation do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Request Form Fields</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Define the inputs users fill in when requesting this automation.
            </p>
          </div>
          <button onClick={addField} className="btn-secondary">
            <Plus className="h-4 w-4" /> Add field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
            No fields yet. Click <span className="text-slate-200">Add field</span> to define one.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div
                key={f.id}
                className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <button
                      onClick={() => moveField(f.id, -1)}
                      disabled={idx === 0}
                      className="text-slate-500 hover:text-slate-200 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <GripVertical className="h-3 w-3 text-slate-600 my-1" />
                    <button
                      onClick={() => moveField(f.id, 1)}
                      disabled={idx === fields.length - 1}
                      className="text-slate-500 hover:text-slate-200 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Label</label>
                      <input
                        className="input"
                        value={f.label}
                        onChange={(e) => updateField(f.id, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select
                        className="input"
                        value={f.type}
                        onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Placeholder</label>
                      <input
                        className="input"
                        value={f.placeholder ?? ""}
                        onChange={(e) => updateField(f.id, { placeholder: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Required</label>
                      <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-700 bg-slate-900 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500"
                          checked={!!f.required}
                          onChange={(e) => updateField(f.id, { required: e.target.checked })}
                        />
                        Mandatory
                      </label>
                    </div>
                    {f.type === "select" && (
                      <div className="md:col-span-2">
                        <label className="label">Options (one per line)</label>
                        <textarea
                          className="input min-h-[80px]"
                          value={(f.options ?? []).join("\n")}
                          onChange={(e) =>
                            updateField(f.id, {
                              options: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeField(f.id)}
                    className="btn-ghost h-8 w-8 p-0 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button onClick={save} disabled={loading || !name} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Save changes" : "Create automation"}
        </button>
      </div>
    </div>
  );
}
