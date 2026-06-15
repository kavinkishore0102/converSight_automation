import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { uid } from "./utils";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export type Role = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "email"
  | "url"
  | "date"
  | "checkbox";

export type AutomationField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
  helpText?: string;
  /** Key sent to the automation engine in `details`. Defaults to `id`. */
  key?: string;
};

export type Automation = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  enabled: boolean;
  fields: AutomationField[];
  /** Category string expected by the IrtAutomationFlow engine. Leave empty for manual-only automations. */
  backendCategory?: string;
  /** When true, requests must be approved by an admin before the engine runs.
   *  When false (default), the engine is invoked immediately on submission. */
  requiresApproval?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RequestStatus =
  | "Waiting for Approval"
  | "Approved"
  | "In Progress"
  | "Completed"
  | "Rejected";

export type AutomationRequest = {
  id: string;
  automationId: string;
  automationName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  environment: string;
  summary: string;
  details: string;
  data: Record<string, string | number | boolean>;
  status: RequestStatus;
  adminNote?: string;
  /** Raw result returned by the automation engine, stored as JSON text. */
  result?: string;
  createdAt: string;
  updatedAt: string;
};

type DbShape = {
  users: User[];
  automations: Automation[];
  requests: AutomationRequest[];
};

const EMPTY: DbShape = { users: [], automations: [], requests: [] };

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readDb(): DbShape {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2));
    seedIfEmpty();
  }
  const raw = fs.readFileSync(DB_PATH, "utf8");
  try {
    return JSON.parse(raw) as DbShape;
  } catch {
    return EMPTY;
  }
}

export function writeDb(db: DbShape) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function seedIfEmpty() {
  const db: DbShape = fs.existsSync(DB_PATH)
    ? JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
    : { ...EMPTY };

  if (db.users.length === 0) {
    db.users = [
      {
        id: uid("usr"),
        name: "Admin",
        email: "admin@conversight.ai",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: uid("usr"),
        name: "Demo User",
        email: "user@conversight.ai",
        passwordHash: bcrypt.hashSync("user123", 10),
        role: "user",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  if (db.automations.length === 0) {
    const now = new Date().toISOString();
    db.automations = [
      {
        id: uid("aut"),
        name: "Activate Dataset",
        category: "Dataset",
        description: "Activate a dataset schema for an organization.",
        icon: "Database",
        enabled: true,
        backendCategory: "Activate Dataset",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true, placeholder: "e.g. acme01" },
          { id: "dataset_id", label: "Dataset ID", type: "text", required: true, placeholder: "dataset_v1 _key" },
          { id: "schema_to_activate", label: "Schema to activate", type: "text", required: true, placeholder: "schema name" },
          {
            id: "activate_mode",
            label: "Activation mode",
            type: "select",
            required: true,
            options: ["current", "in_progress", "backup"],
            helpText: "current = activate_current_schema, in_progress = activate_in_progress_schema, backup = activate_backup_schema",
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Increase Session Timeout",
        category: "Session",
        description: "Raise the session timeout for a resource.",
        icon: "Clock",
        enabled: true,
        backendCategory: "Increase Session Timeout",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "resource_id", label: "Resource ID", type: "text", required: true },
          { id: "time_in_minutes", label: "Timeout (minutes)", type: "number", required: true, placeholder: "60" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Remove SME Duplicates",
        category: "Dataset",
        description: "Remove duplicate SME metadata and/or synonym records for a dataset.",
        icon: "Trash2",
        enabled: true,
        backendCategory: "Remove SME Duplicates",
        fields: [
          { id: "dataset_id", label: "Dataset ID", type: "text", required: true },
          { id: "remove_metadata_duplicate", label: "Remove metadata duplicates", type: "checkbox" },
          { id: "remove_synonym_duplicate", label: "Remove synonym duplicates", type: "checkbox" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Remove Insight Duplicates",
        category: "Insights",
        description: "Deduplicate generated insights for an organization.",
        icon: "Sparkles",
        enabled: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Update Refresh Time",
        category: "Scheduler",
        description: "Replace the data refresh schedule and timezone for an organization.",
        icon: "RefreshCw",
        enabled: true,
        backendCategory: "Update Refresh Time",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "timezone", label: "Timezone", type: "text", required: true, placeholder: "e.g. AEST, IST, PST" },
          {
            id: "refresh_times",
            label: "Refresh times",
            type: "textarea",
            required: true,
            placeholder: "One per line, e.g. 2025-08-26T09:30",
            helpText: "Local times in the timezone above. One per line or comma-separated.",
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Add Refresh Time",
        category: "Scheduler",
        description: "Add a new refresh time to an organization's data refresh schedule.",
        icon: "Timer",
        enabled: true,
        backendCategory: "Add Refresh Time",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "refresh_time", label: "Refresh time", type: "text", required: true, placeholder: "2026-05-27T16:30:00 IST" },
          { id: "schedule_name", label: "Schedule name", type: "text", placeholder: "Default Schedule" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Remove Refresh Time",
        category: "Scheduler",
        description: "Remove an existing refresh time from an organization's data refresh schedule.",
        icon: "TimerOff",
        enabled: true,
        backendCategory: "Remove Refresh Time",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "refresh_time", label: "Refresh time", type: "text", required: true, placeholder: "2026-05-27T16:30:00 IST" },
          { id: "schedule_name", label: "Schedule name", type: "text", placeholder: "Default Schedule" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Enable Connector V2 Menu",
        category: "Feature Flag",
        description: "Toggle the Connector V2 menu in the UI.",
        icon: "ToggleRight",
        enabled: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "enable", label: "Enable", type: "checkbox" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Enable Athena Iq Menu",
        category: "Feature Flag",
        description: "Enable the Athena IQ menu in the workspace.",
        icon: "Zap",
        enabled: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Enable Athena Threads",
        category: "Feature Flag",
        description: "Enable Athena threads for a dataset and sync proactive insight templates.",
        icon: "MessageSquare",
        enabled: true,
        backendCategory: "Enable Athena Threads",
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "dataset_id", label: "Dataset ID", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Admin Email Changes",
        category: "Admin",
        description: "Change a user's email across user, auth, dataset and organization records.",
        icon: "Mail",
        enabled: true,
        backendCategory: "Admin Email changes",
        fields: [
          { id: "role", label: "Role", type: "select", required: true, options: ["user", "admin"] },
          { id: "old_email", label: "Current email", type: "email", required: true },
          { id: "new_email", label: "New email", type: "email", required: true },
          { id: "user_id", label: "User ID", type: "text", helpText: "Required when role = admin" },
          { id: "dataset_id", label: "Dataset ID", type: "text", helpText: "Required when role = admin" },
          { id: "org_id", label: "Org ID", type: "text", helpText: "Required when role = admin" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Increase User Count",
        category: "Admin",
        description: "Increase the licensed user count for an organization.",
        icon: "Users",
        enabled: true,
        backendCategory: "Increase User Count",
        requiresApproval: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "user_count", label: "User count", type: "number", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Extend Trail Period",
        category: "Admin",
        description: "Extend the trial expiry date for an organization.",
        icon: "CalendarClock",
        enabled: true,
        backendCategory: "Extend Trial Period",
        requiresApproval: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "extend_period", label: "New expiry date", type: "date", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Change Data Fetch Limit",
        category: "Admin",
        description: "Adjust the maximum data fetch limit for an organization.",
        icon: "Gauge",
        enabled: true,
        backendCategory: "Change Data Fetch Limit",
        requiresApproval: true,
        fields: [
          { id: "org_id", label: "Org ID", type: "text", required: true },
          { id: "fetch_limit", label: "New fetch limit", type: "number", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  writeDb(db);
}

// Helpers

export function findUserByEmail(email: string) {
  return readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string) {
  return readDb().users.find((u) => u.id === id);
}

export function listAutomations() {
  return readDb().automations;
}

export function getAutomation(id: string) {
  return readDb().automations.find((a) => a.id === id);
}

export function createAutomation(
  input: Omit<Automation, "id" | "createdAt" | "updatedAt">
) {
  const db = readDb();
  const now = new Date().toISOString();
  const automation: Automation = { ...input, id: uid("aut"), createdAt: now, updatedAt: now };
  db.automations.unshift(automation);
  writeDb(db);
  return automation;
}

export function updateAutomation(id: string, patch: Partial<Automation>) {
  const db = readDb();
  const idx = db.automations.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  db.automations[idx] = { ...db.automations[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.automations[idx];
}

export function deleteAutomation(id: string) {
  const db = readDb();
  db.automations = db.automations.filter((a) => a.id !== id);
  writeDb(db);
}

export function listRequests() {
  return readDb().requests;
}

export function listRequestsByUser(userId: string) {
  return readDb().requests.filter((r) => r.requesterId === userId);
}

export function createRequest(
  input: Omit<AutomationRequest, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: RequestStatus;
  }
) {
  const db = readDb();
  const now = new Date().toISOString();
  const request: AutomationRequest = {
    ...input,
    status: input.status ?? "Waiting for Approval",
    id: uid("req"),
    createdAt: now,
    updatedAt: now,
  };
  db.requests.unshift(request);
  writeDb(db);
  return request;
}

export function updateRequest(id: string, patch: Partial<AutomationRequest>) {
  const db = readDb();
  const idx = db.requests.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  db.requests[idx] = { ...db.requests[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.requests[idx];
}

export function getRequest(id: string) {
  return readDb().requests.find((r) => r.id === id);
}
