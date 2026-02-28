/** API クライアント */

const BASE = "/api";

export interface WebhookListItem {
  id: string;
  source: string;
  event_type: string;
  group_key: string;
  received_at: string;
  analyzed: boolean;
  has_drift?: boolean;
  sequence_index?: number | null;
  http_method?: string | null;
  remote_ip?: string | null;
}

export interface WebhookDetail {
  id: string;
  source: string;
  event_type: string;
  group_key: string;
  payload: Record<string, unknown>;
  received_at: string;
  schema_drift?: {
    has_drift: boolean;
    added?: string[];
    removed?: string[];
    type_changed?: Array<{
      path: string;
      expected_type: string;
      actual_type: string;
    }>;
    risk_level?: string;
  } | null;
  sequence_index?: number | null;
  http_method?: string | null;
  remote_ip?: string | null;
  request_headers?: Record<string, string> | null;
}

export interface StatsResponse {
  by_source: Record<string, number>;
  by_event_type: Record<string, number>;
}

export interface WebhookAnalysisResponse {
  id: string;
  webhook_id: string;
  summary: string | null;
  field_descriptions: Record<string, string>;
  explanation?: string | null;  // US-127: DB のみ、YAML には出さない
  analyzed_at: string;
  from_definition_file?: boolean;
}

export interface WebhookListResponse {
  items: WebhookListItem[];
  total: number;
}

export async function listWebhooks(
  params?: {
    source?: string;
    event_type?: string;
    analyzed?: boolean;
    has_drift?: boolean;
    session_id?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }
): Promise<WebhookListResponse> {
  const cleanParams: Record<string, string> = {};
  if (params?.source) cleanParams.source = params.source;
  if (params?.event_type) cleanParams.event_type = params.event_type;
  if (params?.analyzed !== undefined) cleanParams.analyzed = String(params.analyzed);
  if (params?.has_drift !== undefined) cleanParams.has_drift = String(params.has_drift);
  if (params?.session_id) cleanParams.session_id = params.session_id;
  if (params?.q) cleanParams.q = params.q;
  if (params?.limit != null) cleanParams.limit = String(params.limit);
  if (params?.offset != null) cleanParams.offset = String(params.offset);
  const search = new URLSearchParams(cleanParams).toString();
  const url = `${BASE}/webhooks${search ? `?${search}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getWebhook(id: string): Promise<WebhookDetail> {
  const res = await fetch(`${BASE}/webhooks/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface AdjacentResponse {
  prev_id: string | null;
  next_id: string | null;
}

export async function getAdjacentWebhooks(
  id: string
): Promise<AdjacentResponse> {
  const res = await fetch(`${BASE}/webhooks/${id}/adjacent`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface EventTypeGroup {
  event_type: string;
  count: number;
  sample: WebhookListItem;
  is_known: boolean;
}

export interface EventTypeGroupResponse {
  groups: EventTypeGroup[];
}

export interface SchemaField {
  path: string;
  type: string;
  occurrence_rate: number;
  required: boolean;
}

export interface SchemaEstimateResponse {
  event_type: string;
  source: string | null;
  total_samples: number;
  fields: SchemaField[];
}

export async function getSchemaEstimate(
  eventType: string,
  source?: string
): Promise<SchemaEstimateResponse> {
  const params = new URLSearchParams({ event_type: eventType });
  if (source) params.set("source", source);
  const res = await fetch(`${BASE}/webhooks/schema/estimate?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err?.detail === "string"
        ? err.detail
        : Array.isArray(err?.detail)
          ? err.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export async function getGroupedByEventType(): Promise<EventTypeGroupResponse> {
  const res = await fetch(`${BASE}/webhooks/grouped-by-event-type`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface Session {
  id: string;
  name: string;
  webhook_count: number;
  created_at: string;
}

export async function listSessions(): Promise<{ sessions: Session[] }> {
  const res = await fetch(`${BASE}/sessions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createSession(name: string): Promise<Session> {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addWebhookToSession(
  sessionId: string,
  webhookId: string
): Promise<void> {
  const res = await fetch(
    `${BASE}/sessions/${sessionId}/webhooks/${webhookId}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${BASE}/webhooks/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function batchAnalyze(
  webhookIds: string[]
): Promise<{ total: number; completed: number; failed: number }> {
  const res = await fetch(`${BASE}/webhooks/batch-analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhook_ids: webhookIds }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function triggerAnalyze(
  webhookId: string,
  userFeedback?: string | null
): Promise<WebhookAnalysisResponse> {
  const body: { user_feedback?: string } = {};
  if (userFeedback && userFeedback.trim()) {
    body.user_feedback = userFeedback.trim();
  }
  const res = await fetch(`${BASE}/webhooks/${webhookId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** US-145: Webhook を指定 URL へ再送 */
export interface ReplayResponse {
  status_code: number;
  elapsed_ms: number;
  success: boolean;
  error?: string | null;
}

export async function replayWebhook(
  webhookId: string,
  targetUrl: string
): Promise<ReplayResponse> {
  const res = await fetch(`${BASE}/webhooks/${webhookId}/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_url: targetUrl }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getAnalysis(webhookId: string): Promise<WebhookAnalysisResponse | null> {
  const res = await fetch(`${BASE}/webhooks/${webhookId}/analysis`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface FieldTemplateItem {
  path: string;
  description: string;
  notes?: string | null;
  reference_url?: string | null;
}

export interface FieldTemplateResponse {
  source: string;
  event_type: string;
  fields: FieldTemplateItem[];
}

export async function getFieldTemplate(
  source: string,
  eventType: string
): Promise<FieldTemplateResponse | null> {
  const params = new URLSearchParams({ source, event_type: eventType });
  const res = await fetch(`${BASE}/webhooks/field-templates?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
