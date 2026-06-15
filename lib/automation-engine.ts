import { Automation } from "./db";
import { createLogger } from "./logger";

const log = createLogger("automation-engine");

/**
 * Converts the raw form values submitted by a user into the `details`
 * payload shape expected by the IrtAutomationFlow step flow for the
 * given automation's backendCategory.
 */
export function buildDetails(
  automation: Automation,
  data: Record<string, string | number | boolean>
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const field of automation.fields) {
    const key = field.key || field.id;
    const value = data[field.id];
    if (value === undefined || value === "") continue;
    raw[key] = value;
  }

  switch (automation.backendCategory) {
    case "Activate Dataset": {
      const mode = raw.activate_mode as string | undefined;
      const { activate_mode, schema_to_activate, ...rest } = raw;
      return {
        ...rest,
        schema: {
          schema_to_activate,
          activate_current_schema: mode === "current",
          activate_in_progress_schema: mode === "in_progress",
          activate_backup_schema: mode === "backup",
        },
      };
    }

    case "Update Refresh Time": {
      const { refresh_times, ...rest } = raw;
      const refreshTime = String(refresh_times ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { ...rest, refreshTime };
    }

    case "Remove SME Duplicates":
      return {
        dataset_id: raw.dataset_id,
        remove_synonym_duplicate: !!raw.remove_synonym_duplicate,
        remove_metadata_duplicate: !!raw.remove_metadata_duplicate,
      };

    case "Increase Session Timeout":
      return {
        org_id: raw.org_id,
        resource_id: raw.resource_id,
        time_in_minutes: String(raw.time_in_minutes ?? ""),
      };

    case "Increase User Count":
      return {
        org_id: raw.org_id,
        user_count: Number(raw.user_count ?? 0),
      };

    case "Extend Trial Period":
      return {
        org_id: raw.org_id,
        extend_period: raw.extend_period,
      };

    default:
      return raw;
  }
}

export type EngineResult = {
  status?: string;
  simulated?: boolean;
  [key: string]: unknown;
};

export type EngineContext = {
  /** Portal request id (req_xxx) — included in every log line for traceability. */
  requestId: string;
  /** Who triggered this run — admin email for approval flows, user email for auto-run. */
  triggeredBy: string;
};

function newCorrelationId() {
  return `eng_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Calls the IrtAutomationFlow step flow with source "portal" (no Slack/Jira).
 * Emits structured JSON logs at every boundary (received → connecting → response).
 * If the engine environment variables are not configured, returns a simulated
 * result so the request/approval flow can be exercised end-to-end without a
 * live backend connection.
 */
export async function executeAutomation(
  category: string,
  details: Record<string, unknown>,
  ctx: EngineContext
): Promise<EngineResult> {
  const correlationId = newCorrelationId();
  const baseUrl = process.env.UE_BASE_URL;
  const crn = process.env.UE_STEP_FLOW_CRN;
  const token = process.env.UE_BEARER_TOKEN;

  const base = {
    correlationId,
    requestId: ctx.requestId,
    triggeredBy: ctx.triggeredBy,
    category,
  };

  log.info("engine.request.received", { ...base, details });

  if (!baseUrl || !crn || !token) {
    log.warn("engine.not_configured", {
      ...base,
      reason: "UE_BASE_URL / UE_STEP_FLOW_CRN / UE_BEARER_TOKEN not set — returning simulated result",
    });
    return {
      status: "success",
      simulated: true,
      correlationId,
      message: "Automation engine is not configured — returning a simulated result.",
      category,
      details,
    };
  }

  const url = `${baseUrl}/execute/step_flow/${crn}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
    "X-Correlation-Id": correlationId,
  };
  const payload = {
    config: {
      source: "portal",
      category,
      details: JSON.stringify(details),
      slackID: "",
    },
  };

  log.info("engine.connecting", {
    ...base,
    url,
    method: "POST",
    headers,
    payloadBytes: JSON.stringify(payload).length,
  });

  // Human-readable banner so the engine call is easy to spot in stdout/console.
  const bodyStr = JSON.stringify(payload, null, 2);
  console.log("\n----------- Calling Universe Engine ----------------");
  console.log(`correlationId : ${correlationId}`);
  console.log(`requestId     : ${ctx.requestId}`);
  console.log(`url           : POST ${url}`);
  console.log(`headers       : ${JSON.stringify({ ...headers, Authorization: redactHeader(headers.Authorization) })}`);
  console.log(`request body  :\n${bodyStr}`);
  console.log("---------------------------------------------------------\n");

  console.log(`[engine] opening HTTPS connection to ${new URL(url).host} …`);

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    log.error("engine.network_error", {
      ...base,
      url,
      durationMs: Date.now() - startedAt,
      error: err?.message ?? String(err),
    });
    console.log("\n----------- Universe Engine UNREACHABLE -----------------");
    console.log(`correlationId : ${correlationId}`);
    console.log(`error         : ${err?.message ?? String(err)}`);
    console.log(`durationMs    : ${Date.now() - startedAt}`);
    console.log("---------------------------------------------------------\n");
    throw new Error(`Automation engine unreachable: ${err?.message ?? err}`);
  }

  console.log(`[engine] connection established, received ${res.status} ${res.statusText || ""}`.trim());

  const durationMs = Date.now() - startedAt;
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  log.info("engine.response", {
    ...base,
    url,
    httpStatus: res.status,
    durationMs,
    responseBytes: text.length,
    ok: res.ok,
  });

  console.log("\n----------- Universe Engine Response ----------------");
  console.log(`correlationId : ${correlationId}`);
  console.log(`httpStatus    : ${res.status}`);
  console.log(`durationMs    : ${durationMs}`);
  console.log(`response body :\n${typeof json === "object" ? JSON.stringify(json, null, 2) : text}`);
  console.log("---------------------------------------------------------\n");

  if (!res.ok) {
    const message =
      (json as any)?.error || (json as any)?.message || `Automation engine returned ${res.status}`;
    log.error("engine.failure", { ...base, httpStatus: res.status, message, body: json });
    throw new Error(message);
  }

  log.info("engine.success", {
    ...base,
    durationMs,
    arangoTouched: extractArangoSignal(json),
    resultStatus: (json as any)?.status,
  });

  return { ...(json as object), correlationId } as EngineResult;
}

/**
 * Inspect the engine response for signals that ArangoDB was actually touched,
 * so the success log line carries a quick verification field.
 */
function redactHeader(value: string | undefined): string {
  if (!value) return "<none>";
  if (value.length <= 16) return "<redacted>";
  return `${value.slice(0, 12)}…<redacted>`;
}

function extractArangoSignal(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const s = JSON.stringify(json).toLowerCase();
  return (
    s.includes("arango") ||
    s.includes("organization") ||
    s.includes("dataset_v1") ||
    s.includes("updated") ||
    s.includes("expirytime")
  );
}
