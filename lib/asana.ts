import type { Automation } from "./db";
import { createLogger } from "./logger";

const log = createLogger("asana");
const BASE = "https://app.asana.com/api/1.0";

export type AsanaSection = "todo" | "inprogress" | "done" | "rejected";

export type AsanaRequest = {
  id: string;           // Asana task GID — the single identifier everywhere
  automationId: string;
  automationName: string;
  category: string;
  requesterEmail: string;
  requesterName: string;
  summary: string;
  details: string;
  environment: string;
  status: string;
  asanaTaskId: string;  // same as id, kept for compat
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  data: Record<string, any>;
  adminNote: string;
  result?: string;
};

export type CreateRequestInput = {
  automationId: string;
  automationName: string;
  requesterEmail: string;
  requesterName: string;
  summary: string;
  details: string;
  environment: string;
  data: Record<string, any>;
  status: string;
};

type CustomFieldInfo = { gid: string; type: string };
let cachedCF: Record<string, CustomFieldInfo> | null = null;
let cachedWorkspaceGid: string | null = null;

// ─── Config ──────────────────────────────────────────────────────────────────

function cfg() {
  return {
    token:      process.env.ASANA_TOKEN,
    projectGid: process.env.ASANA_PROJECT_GID,
    sections: {
      todo:       process.env.ASANA_SECTION_TODO       ?? "",
      inprogress: process.env.ASANA_SECTION_INPROGRESS ?? "",
      done:       process.env.ASANA_SECTION_DONE       ?? "",
      rejected:   process.env.ASANA_SECTION_REJECTED   ?? "",
    },
  };
}

function isConfigured(): boolean {
  const { token, projectGid, sections } = cfg();
  return !!(token && projectGid && sections.todo);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function asanaPost(path: string, body: unknown): Promise<unknown> {
  const { token } = cfg();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Asana POST ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

async function asanaGet(path: string, timeoutMs = 30_000): Promise<unknown> {
  const { token } = cfg();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Asana GET ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

async function asanaPut(path: string, body: unknown): Promise<void> {
  const { token } = cfg();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Asana PUT ${res.status}: ${text.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// ─── Custom field helpers ─────────────────────────────────────────────────────

/** Fetches workspace GID from the project once and caches it. */
async function getWorkspaceGid(): Promise<string | null> {
  if (cachedWorkspaceGid) return cachedWorkspaceGid;
  const { projectGid } = cfg();
  try {
    const result = (await asanaGet(`/projects/${projectGid}?opt_fields=workspace.gid`)) as {
      data: { workspace: { gid: string } };
    };
    cachedWorkspaceGid = result.data.workspace.gid;
    return cachedWorkspaceGid;
  } catch (err: any) {
    log.warn("asana.workspace_gid_fetch_failed", { error: err.message });
    return null;
  }
}

/** Fetches project custom fields once and caches them by lowercase name. */
async function getCustomFields(): Promise<Record<string, CustomFieldInfo>> {
  if (cachedCF) return cachedCF;
  const { projectGid } = cfg();
  try {
    const result = (await asanaGet(
      `/projects/${projectGid}?opt_fields=custom_field_settings.custom_field.gid,custom_field_settings.custom_field.name,custom_field_settings.custom_field.type`,
    )) as {
      data: {
        custom_field_settings: Array<{
          custom_field: { gid: string; name: string; type: string };
        }>;
      };
    };
    cachedCF = {};
    for (const s of result.data.custom_field_settings ?? []) {
      const { gid, name, type } = s.custom_field;
      cachedCF[name.toLowerCase()] = { gid, type };
    }
    log.info("asana.custom_fields_loaded", { fields: Object.keys(cachedCF) });
  } catch (err: any) {
    log.error("asana.fetch_custom_fields_failed", { error: err.message });
    cachedCF = {};
  }
  return cachedCF;
}

/** Builds the custom_fields payload for a task create/update. */
async function buildCustomFields(
  category: string,
  submittedAt: string,
): Promise<Record<string, any>> {
  const fields = await getCustomFields();
  const out: Record<string, any> = {};

  const catField = fields["category"];
  if (catField) {
    // text or enum — send string value
    out[catField.gid] = category;
  }

  const satField = fields["submitted at"];
  if (satField) {
    if (satField.type === "date") {
      // Asana date fields require { date: "YYYY-MM-DD" } object
      out[satField.gid] = { date: submittedAt.split("T")[0] };
    } else {
      out[satField.gid] = submittedAt;
    }
  }

  return out;
}

// ─── Meta block (stores all request data inside Asana task notes) ─────────────

const META_RE = /\[IRT\]([\s\S]*?)\[\/IRT\]/;

function encodeMeta(value: string): string {
  return Buffer.from(value).toString("base64");
}

function decodeMeta(value: string): string {
  try { return Buffer.from(value, "base64").toString(); } catch { return value; }
}

function parseMeta(notes: string): Record<string, string> {
  const match = META_RE.exec(notes ?? "");
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const eq = l.indexOf("=");
        return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()];
      }),
  );
}

function buildMetaBlock(m: Record<string, string>): string {
  const body = Object.entries(m).map(([k, v]) => `${k}=${v}`).join("\n");
  return `[IRT]\n${body}\n[/IRT]`;
}

function buildNotes(automation: Automation, input: CreateRequestInput): string {
  const meta = buildMetaBlock({
    automation_id:   input.automationId,
    automation_name: input.automationName,
    email:           input.requesterEmail,
    category:        automation.backendCategory ?? automation.category,
    environment:     input.environment,
    summary:         input.summary,
    submitted_at:    new Date().toISOString(),
    completed_at:    "",
    status:          input.status,
    admin_note:      "",
    data_b64:        encodeMeta(JSON.stringify(input.data ?? {})),
    details_b64:     encodeMeta(input.details ?? ""),
  });

  const lines = [
    `Automation : ${input.automationName}`,
    `Category   : ${automation.backendCategory ?? automation.category}`,
    `Requester  : ${input.requesterEmail}`,
    `Environment: ${input.environment}`,
    `Summary    : ${input.summary}`,
    "",
    "Parameters:",
    JSON.stringify(input.data, null, 2),
  ];
  if (input.details) lines.push("", "Additional details:", input.details);

  return meta + "\n\n" + lines.join("\n");
}

/** Extract a labelled line from old-format notes, e.g. "Requester  : email@x.com" */
function extractLine(notes: string, key: string): string {
  const m = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im").exec(notes);
  return m?.[1]?.trim() ?? "";
}

function taskToRequest(task: any): AsanaRequest | null {
  const notes   = task.notes ?? "";
  const meta    = parseMeta(notes);

  // Support both new [IRT] block and old plain-text notes format
  const email = meta.email || extractLine(notes, "Requester");
  if (!email) return null;  // can't identify requester — skip

  const section = task.memberships?.[0]?.section?.name ?? "";
  const status  = sectionToStatus(section) || meta.status || "Waiting for Approval";

  // Name format: "[Automation Name] Summary"
  const nameMatch    = /^\[(.+?)\]\s*(.*)/.exec(task.name ?? "");
  const automationName = meta.automation_name
    || extractLine(notes, "Automation")
    || nameMatch?.[1]
    || task.name
    || "";
  const summaryFromName = nameMatch?.[2] ?? "";

  let data: Record<string, any> = {};
  try { data = JSON.parse(decodeMeta(meta.data_b64 ?? "")); } catch {}

  return {
    id:             task.gid,
    automationId:   meta.automation_id  ?? "",
    automationName,
    category:       meta.category       || extractLine(notes, "Category")    || "",
    requesterEmail: email,
    requesterName:  email.split("@")[0],
    summary:        meta.summary        || summaryFromName                    || "",
    details:        decodeMeta(meta.details_b64 ?? ""),
    environment:    meta.environment    || extractLine(notes, "Environment")  || "",
    status,
    asanaTaskId:    task.gid,
    createdAt:      meta.submitted_at   || task.created_at,
    updatedAt:      task.modified_at    || meta.submitted_at || task.created_at,
    completedAt:    meta.completed_at   || null,
    data,
    adminNote:      decodeMeta(meta.admin_note ?? "") || meta.admin_note || "",
    result:         meta.result ? decodeMeta(meta.result) : undefined,
  };
}

function sectionToStatus(name: string): string {
  const n = (name ?? "").toUpperCase();
  if (n.includes("DONE"))     return "Completed";
  if (n.includes("REJECT"))   return "Rejected";
  if (n.includes("PROGRESS")) return "In Progress";
  if (n.includes("TO DO") || n.includes("TODO")) return "Waiting for Approval";
  return "";
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Creates an Asana task storing all request data in the [IRT] meta block.
 * Returns the full AsanaRequest (id = task GID), or null on failure.
 */
export async function createAsanaRequest(
  automation: Automation,
  input: CreateRequestInput,
  initialSection: AsanaSection = "inprogress",
): Promise<AsanaRequest | null> {
  if (!isConfigured()) {
    log.warn("asana.not_configured");
    return null;
  }

  const { projectGid, sections } = cfg();
  const taskName   = `[${input.automationName}] ${input.summary}`;
  const submittedAt = new Date().toISOString();
  const customFields = await buildCustomFields(
    automation.backendCategory ?? automation.category,
    submittedAt,
  );

  try {
    const result = (await asanaPost("/tasks", {
      data: {
        name:         taskName,
        notes:        buildNotes(automation, input),
        projects:     [projectGid],
        memberships:  [{ project: projectGid, section: sections[initialSection] }],
        custom_fields: customFields,
      },
    })) as { data: { gid: string } };

    const gid = result.data.gid;
    log.info("asana.request_created", { gid, taskName });

    return {
      id:             gid,
      automationId:   input.automationId,
      automationName: input.automationName,
      category:       automation.backendCategory ?? automation.category,
      requesterEmail: input.requesterEmail,
      requesterName:  input.requesterName,
      summary:        input.summary,
      details:        input.details,
      environment:    input.environment,
      status:         input.status,
      asanaTaskId:    gid,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
      completedAt:    null,
      data:           input.data,
      adminNote:      "",
    };
  } catch (err: any) {
    log.error("asana.create_failed", { error: err.message });
    return null;
  }
}

/** Moves an Asana task to a different section. */
export async function moveAsanaTask(
  taskGid: string | undefined | null,
  section: AsanaSection,
): Promise<void> {
  if (!isConfigured() || !taskGid) return;
  const { sections } = cfg();
  const sectionGid = sections[section];
  if (!sectionGid) { log.warn("asana.section_not_configured", { section }); return; }
  try {
    await asanaPost(`/sections/${sectionGid}/addTask`, { data: { task: taskGid } });
    log.info("asana.task_moved", { taskGid, section });
  } catch (err: any) {
    log.error("asana.move_failed", { taskGid, section, error: err.message });
  }
}

/** Updates specific fields in the [IRT] meta block of an existing task. */
export async function updateAsanaRequestMeta(
  taskGid: string,
  updates: Record<string, string>,
): Promise<void> {
  if (!isConfigured() || !taskGid) return;
  try {
    const result = (await asanaGet(`/tasks/${taskGid}?opt_fields=notes`)) as { data: { notes: string } };
    const currentNotes = result.data.notes ?? "";
    const meta = parseMeta(currentNotes);
    Object.assign(meta, updates);
    const newNotes = META_RE.test(currentNotes)
      ? currentNotes.replace(META_RE, buildMetaBlock(meta))
      : buildMetaBlock(meta) + "\n\n" + currentNotes;
    await asanaPut(`/tasks/${taskGid}`, { data: { notes: newNotes } });
    log.info("asana.meta_updated", { taskGid, keys: Object.keys(updates) });
  } catch (err: any) {
    log.error("asana.meta_update_failed", { taskGid, error: err.message });
  }
}

/** Fetches all requests from the project (for admin queue). */
export async function fetchAllAsanaRequests(): Promise<AsanaRequest[]> {
  if (!isConfigured()) return [];
  const { projectGid } = cfg();
  try {
    const result = (await asanaGet(
      `/projects/${projectGid}/tasks?opt_fields=gid,name,notes,memberships.section.name,created_at,modified_at&limit=100`,
    )) as { data: any[] };

    return (result.data ?? [])
      .map(taskToRequest)
      .filter((r): r is AsanaRequest => r !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err: any) {
    log.error("asana.fetch_all_failed", { error: err.message });
    return [];
  }
}

/** Fetches a single request by Asana task GID. */
export async function getAsanaRequest(taskGid: string): Promise<AsanaRequest | null> {
  if (!isConfigured()) return null;
  try {
    const result = (await asanaGet(
      `/tasks/${taskGid}?opt_fields=gid,name,notes,memberships.section.name,created_at,modified_at`,
    )) as { data: any };
    return taskToRequest(result.data);
  } catch (err: any) {
    log.error("asana.get_task_failed", { taskGid, error: err.message });
    return null;
  }
}

/** Fetches requests filtered by requester email using Asana workspace search. */
export async function fetchAsanaRequestsByEmail(email: string): Promise<AsanaRequest[]> {
  if (!isConfigured()) return [];
  const { projectGid } = cfg();

  const workspaceGid = await getWorkspaceGid();
  if (!workspaceGid) {
    // Fallback: filter from full project list
    const all = await fetchAllAsanaRequests();
    return all.filter((r) => r.requesterEmail.toLowerCase() === email.toLowerCase());
  }

  try {
    const params = new URLSearchParams({
      text:            email,
      "projects.any":  projectGid!,
      opt_fields:      "gid,name,notes,memberships.section.name,created_at,modified_at",
      limit:           "100",
    });
    const result = (await asanaGet(
      `/workspaces/${workspaceGid}/tasks/search?${params}`,
    )) as { data: any[] };

    return (result.data ?? [])
      .map(taskToRequest)
      .filter((r): r is AsanaRequest => r !== null && r.requesterEmail.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err: any) {
    log.error("asana.search_by_email_failed", { error: err.message });
    // Fallback: filter from full project list
    const all = await fetchAllAsanaRequests();
    return all.filter((r) => r.requesterEmail.toLowerCase() === email.toLowerCase());
  }
}
