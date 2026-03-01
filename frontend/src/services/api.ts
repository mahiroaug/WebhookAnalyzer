/** API クライアント */

const BASE = "/api";

export interface MatchedRule {
  id: string;
  name: string;
}

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
  matched_rules?: MatchedRule[];
  is_read?: boolean;
}

export interface WebhookDetail {
  id: string;
  source: string;
  event_type: string;
  group_key: string;
  payload: Record<string, unknown>;
  received_at: string;
  matched_rules?: MatchedRule[];
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

/** US-146: 異常検知ルール */
export interface AlertRule {
  id: string;
  name: string;
  path: string;
  op: string;
  value: string | number | boolean;
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const res = await fetch(`${BASE}/alert-rules`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createAlertRule(body: {
  name: string;
  path: string;
  op: string;
  value: string | number | boolean;
}): Promise<AlertRule> {
  const res = await fetch(`${BASE}/alert-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function deleteAlertRule(ruleId: string): Promise<void> {
  const res = await fetch(`${BASE}/alert-rules/${ruleId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    is_read?: boolean;  // US-167
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
  if (params?.is_read !== undefined) cleanParams.is_read = String(params.is_read);
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

/** US-160: Webhook を既読にする */
export async function markWebhookRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/webhooks/${id}/read`, { method: "PATCH" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** US-167: フィルタ条件に一致する全 Webhook を既読にする */
export async function markAllWebhooksRead(params?: {
  source?: string;
  event_type?: string;
  q?: string;
}): Promise<{ marked_count: number }> {
  const sp = new URLSearchParams();
  if (params?.source) sp.set("source", params.source);
  if (params?.event_type) sp.set("event_type", params.event_type);
  if (params?.q) sp.set("q", params.q);
  const query = sp.toString();
  const res = await fetch(`${BASE}/webhooks/mark-all-read${query ? `?${query}` : ""}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** US-166: Webhook PDF レポートをダウンロード */
export async function exportWebhookPdf(id: string): Promise<void> {
  const res = await fetch(`${BASE}/webhooks/${id}/export/pdf`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? `webhook-${id}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

/** US-134: 分析ストリーミング。onEvent で各イベントを受け取り、完了時に analysis を返す。US-152: prompt_full, response_full, timestamp */
export interface AnalyzeStreamEvent {
  step: string;
  message?: string;
  elapsed_ms?: number;
  total_elapsed_ms?: number;
  prompt_preview?: string;
  response_preview?: string;
  prompt_full?: string;
  response_full?: string;
  timestamp?: string;
  result?: Record<string, unknown>;
  analysis?: WebhookAnalysisResponse;
}

/** US-143: 分析時の provider/model オーバーライド */
export interface AnalyzeOptions {
  provider?: string;
  model?: string;
}

export async function triggerAnalyzeStream(
  webhookId: string,
  userFeedback: string | null | undefined,
  onEvent: (ev: AnalyzeStreamEvent) => void,
  options?: AnalyzeOptions
): Promise<WebhookAnalysisResponse | null> {
  const body: { user_feedback?: string; provider?: string; model?: string } = {};
  if (userFeedback && userFeedback.trim()) {
    body.user_feedback = userFeedback.trim();
  }
  if (options?.provider) body.provider = options.provider;
  if (options?.model) body.model = options.model;
  const res = await fetch(`${BASE}/webhooks/${webhookId}/analyze/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No body");
  const decoder = new TextDecoder();
  let lastAnalysis: WebhookAnalysisResponse | null = null;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const ev = JSON.parse(line.slice(6)) as AnalyzeStreamEvent;
          onEvent(ev);
          if (ev.step === "saved" && ev.analysis) {
            lastAnalysis = ev.analysis as WebhookAnalysisResponse;
          }
        } catch { /* skip parse error */ }
      }
    }
  }
  return lastAnalysis;
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

/** US-141: 定義ファイルの存在・編集可否 */
export async function getDefinitionStatus(
  source: string,
  eventType: string
): Promise<{ exists: boolean; writable: boolean }> {
  const res = await fetch(
    `${BASE}/definitions/${encodeURIComponent(source)}/${encodeURIComponent(eventType)}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** US-142: 定義ファイルの内容を取得 */
export async function getDefinitionContent(
  source: string,
  eventType: string
): Promise<{ summary: string; field_descriptions: Record<string, string> }> {
  const res = await fetch(
    `${BASE}/definitions/${encodeURIComponent(source)}/${encodeURIComponent(eventType)}/content`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** US-142: AI 分析結果を定義ファイルにマージ */
export async function mergeDefinition(
  source: string,
  eventType: string,
  body: {
    summary?: string;
    field_descriptions?: Record<string, string>;
    removed_paths?: string[];
  }
): Promise<void> {
  const res = await fetch(
    `${BASE}/definitions/${encodeURIComponent(source)}/${encodeURIComponent(eventType)}/merge`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: body.summary,
        field_descriptions: body.field_descriptions ?? {},
        ...(body.removed_paths?.length ? { removed_paths: body.removed_paths } : {}),
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
}

/** US-141: 定義ファイルのフィールド description を更新 */
export async function updateFieldDescription(
  source: string,
  eventType: string,
  path: string,
  description: string
): Promise<void> {
  const res = await fetch(
    `${BASE}/definitions/${encodeURIComponent(source)}/${encodeURIComponent(eventType)}/fields`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, description }),
    }
  );
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
}

/** US-162: サービス接続状況 */
export interface HealthServicesResponse {
  public_url: { url: string; status: "live" | "offline" };
  local_api: { url: string; status: "live" | "offline" };
  postgresql: { status: "live" | "offline" };
  ollama: { status: "live" | "offline" };
}

export async function getHealthServices(): Promise<HealthServicesResponse> {
  const res = await fetch(`${BASE}/health/services`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
