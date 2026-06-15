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
};

export type Automation = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  enabled: boolean;
  fields: AutomationField[];
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
        description: "Activate a dataset for a tenant or workspace.",
        icon: "Database",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true, placeholder: "e.g. acme" },
          { id: uid("f"), label: "Dataset Name", type: "text", required: true, placeholder: "Sales_FY24" },
          { id: uid("f"), label: "Activate Immediately", type: "checkbox" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Increase Session Timeout",
        category: "Session",
        description: "Raise the session timeout for a tenant.",
        icon: "Clock",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "Timeout (minutes)", type: "number", required: true, placeholder: "60" },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Remove SME Duplicates",
        category: "Dataset",
        description: "Run SME duplicate removal job.",
        icon: "Trash2",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "Dataset Name", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Remove Insight Duplicates",
        category: "Insights",
        description: "Deduplicate generated insights for a tenant.",
        icon: "Sparkles",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Change Data Refresh Time",
        category: "Scheduler",
        description: "Reschedule the data refresh window.",
        icon: "RefreshCw",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "New Refresh Time (UTC)", type: "text", required: true, placeholder: "02:00" },
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
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "Enable", type: "checkbox" },
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
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Update Refresh Time",
        category: "Scheduler",
        description: "Generic update to refresh time across datasets.",
        icon: "Timer",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "New Time (UTC)", type: "text", required: true },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("aut"),
        name: "Admin Email Changes",
        category: "Admin",
        description: "Change the admin email contact for a tenant.",
        icon: "Mail",
        enabled: true,
        fields: [
          { id: uid("f"), label: "Tenant ID", type: "text", required: true },
          { id: uid("f"), label: "New Admin Email", type: "email", required: true },
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
