/**
 * Pure formatting helpers used by the Vapi voice webhook.
 * Kept side-effect free and dependency-free so they can be unit-tested.
 */

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^0-9+]/g, "");
}

export function formatTimeSpoken(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  if (minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatDateSpoken(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export interface VapiToolCall {
  id: string;
  name?: string;
  arguments?: Record<string, unknown>;
  function?: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface NormalizedToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/**
 * Vapi sends tool-call payloads in two shapes: top-level (name/arguments)
 * for model.tools, or nested under `function` for Custom Tools. This helper
 * unifies both shapes into a single representation.
 */
export function normalizeToolCall(toolCall: VapiToolCall): NormalizedToolCall {
  const id = toolCall.id;
  const name = toolCall.name || toolCall.function?.name || "unknown";
  const rawArgs = toolCall.arguments || toolCall.function?.arguments || {};
  const args: Record<string, unknown> =
    typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
  return { id, name, args };
}
