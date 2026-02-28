/** API クライアント */

const BASE = "/api";

export interface WebhookListItem {
  id: string;
  source: string;
  event_type: string;
  group_key: string;
  received_at: string;
}

export interface WebhookDetail {
  id: string;
  source: string;
  event_type: string;
  group_key: string;
  payload: Record<string, unknown>;
  received_at: string;
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
  analyzed_at: string;
}

export async function listWebhooks(
  params?: { source?: string; event_type?: string }
): Promise<WebhookListItem[]> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
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

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${BASE}/webhooks/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function triggerAnalyze(webhookId: string): Promise<WebhookAnalysisResponse> {
  const res = await fetch(`${BASE}/webhooks/${webhookId}/analyze`, {
    method: "POST",
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
