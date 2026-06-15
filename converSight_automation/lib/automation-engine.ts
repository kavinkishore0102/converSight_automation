import { Automation } from "./db";

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

/**
 * Calls the IrtAutomationFlow step flow with source "portal" (no Slack/Jira).
 * If the engine environment variables are not configured, returns a
 * simulated result so the request/approval flow can be exercised end-to-end
 * without a live backend connection.
 */
export async function executeAutomation(
  category: string,
  details: Record<string, unknown>
): Promise<EngineResult> {
  const baseUrl = process.env.UE_BASE_URL;
  const crn = process.env.UE_STEP_FLOW_CRN;
  const token = process.env.UE_BEARER_TOKEN;

  if (!baseUrl || !crn || !token) {
    return {
      status: "success",
      simulated: true,
      message:
        "UE_BASE_URL / UE_STEP_FLOW_CRN / UE_BEARER_TOKEN are not configured — returning a simulated result.",
      category,
      details,
    };
  }

  const res = await fetch(`${baseUrl}/execute/step_flow/${crn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      config: {
        source: "portal",
        category,
        details: JSON.stringify(details),
        slackID: "",
      },
    }),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message =
      (json as any)?.error || (json as any)?.message || `Automation engine returned ${res.status}`;
    throw new Error(message);
  }

  return json as EngineResult;
}
