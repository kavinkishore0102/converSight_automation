type Level = "DEBUG" | "INFO" | "WARN" | "ERROR";

/**
 * Structured JSON logger. Every log line is a single JSON object so it can
 * be ingested by log collectors (Datadog, Loki, CloudWatch, etc.) without
 * grok parsing. Sensitive values (Authorization header, password) are
 * redacted before they hit stdout.
 */
function emit(level: Level, service: string, event: string, fields: Record<string, unknown>) {
  const line = {
    timestamp: new Date().toISOString(),
    level,
    service,
    event,
    ...redact(fields),
  };
  const stream = level === "ERROR" || level === "WARN" ? console.error : console.log;
  stream(JSON.stringify(line));
}

const REDACT_KEYS = new Set([
  "authorization",
  "password",
  "passwordhash",
  "token",
  "bearer",
  "secret",
  "cookie",
  "set-cookie",
]);

function redact<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact) as unknown as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = typeof v === "string" && v.length > 12 ? `${v.slice(0, 8)}…<redacted>` : "<redacted>";
      } else {
        out[k] = redact(v);
      }
    }
    return out as T;
  }
  return value;
}

export function createLogger(service: string) {
  return {
    debug: (event: string, fields: Record<string, unknown> = {}) => emit("DEBUG", service, event, fields),
    info: (event: string, fields: Record<string, unknown> = {}) => emit("INFO", service, event, fields),
    warn: (event: string, fields: Record<string, unknown> = {}) => emit("WARN", service, event, fields),
    error: (event: string, fields: Record<string, unknown> = {}) => emit("ERROR", service, event, fields),
  };
}

export type Logger = ReturnType<typeof createLogger>;
