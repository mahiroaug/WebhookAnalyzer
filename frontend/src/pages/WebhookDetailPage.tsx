import { useEffect, useState, useCallback } from "react";

/** US-120: Webhook 遷移時も開閉状態を維持するリクエストヘッダー details */
const REQUEST_HEADERS_STORAGE_KEY = "webhook-detail-request-headers-open";

function RequestHeadersDetails({ headers, count }: { headers: Record<string, string>; count: number }) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(REQUEST_HEADERS_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(REQUEST_HEADERS_STORAGE_KEY, open ? "1" : "0");
    } catch { /* ignore */ }
  }, [open]);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-1"
      >
        {open ? "▼" : "▶"} リクエストヘッダー ({count})
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs font-mono">
          {Object.entries(headers).map(([k, v]) => (
            <span key={k} className="contents">
              <dt className="text-slate-400">{k}</dt>
              <dd className="truncate text-slate-300">{v}</dd>
            </span>
          ))}
        </dl>
      )}
    </div>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import {
  getWebhook,
  getAnalysis,
  getFieldTemplate,
  getAdjacentWebhooks,
  triggerAnalyze,
  type WebhookDetail,
  type WebhookAnalysisResponse,
  type FieldTemplateResponse,
} from "../services/api";
import { PayloadTable } from "../components/PayloadTable";
import { AccordionSection } from "../components/AccordionSection";

export function WebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null);
  const [analysis, setAnalysis] = useState<WebhookAnalysisResponse | null>(null);
  const [fieldTemplate, setFieldTemplate] = useState<FieldTemplateResponse | null>(null);
  const [adjacent, setAdjacent] = useState<{ prev_id: string | null; next_id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const webhookId = id;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [detailRes, analysisRes, adjacentRes] = await Promise.all([
          getWebhook(webhookId),
          getAnalysis(webhookId),
          getAdjacentWebhooks(webhookId),
        ]);
        if (!cancelled) {
          setWebhook(detailRes);
          setAnalysis(analysisRes ?? null);
          setAdjacent(adjacentRes);
          const templateRes = await getFieldTemplate(
            detailRes.source,
            detailRes.event_type
          );
          if (!cancelled) setFieldTemplate(templateRes ?? null);
        }
      } catch {
        if (!cancelled) setWebhook(null);
        if (!cancelled) setAdjacent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const goPrev = useCallback(() => {
    if (adjacent?.prev_id) navigate(`/webhooks/${adjacent.prev_id}`);
  }, [adjacent?.prev_id, navigate]);
  const goNext = useCallback(() => {
    if (adjacent?.next_id) navigate(`/webhooks/${adjacent.next_id}`);
  }, [adjacent?.next_id, navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  async function handleAnalyze() {
    if (!id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await triggerAnalyze(id);
      setAnalysis(res);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setAnalyzing(false);
    }
  }

  const analysisFailed =
    analysis?.summary?.startsWith("[分析失敗]") ?? false;

  if (loading || !webhook) {
    return (
      <div>
        <div className="text-slate-500">
          {loading ? "読み込み中..." : "Webhook が見つかりません"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goPrev} disabled={!adjacent?.prev_id}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
              title="前の Webhook（←）">← 前へ</button>
            <button type="button" onClick={goNext} disabled={!adjacent?.next_id}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
              title="次の Webhook（→）">次へ →</button>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-dim-text-muted">
            {webhook.sequence_index != null ? `#${webhook.sequence_index}` : ""}
          </span>
        </div>
      </header>

      <AccordionSection id="meta" title="リクエスト情報" defaultOpen={false}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">source</dt>
          <dd className="font-mono">{webhook.source}</dd>
          <dt className="text-slate-500 dark:text-slate-400">event_type</dt>
          <dd className="font-mono">{webhook.event_type}</dd>
          <dt className="text-slate-500 dark:text-slate-400">group_key</dt>
          <dd className="font-mono">{webhook.group_key}</dd>
          <dt className="text-slate-500 dark:text-slate-400">received_at</dt>
          <dd className="font-mono">{new Date(webhook.received_at).toLocaleString()}</dd>
          {webhook.http_method && <>
            <dt className="text-slate-500 dark:text-slate-400">HTTP メソッド</dt>
            <dd className="font-mono">{webhook.http_method}</dd>
          </>}
          {webhook.remote_ip && <>
            <dt className="text-slate-500 dark:text-slate-400">送信元 IP</dt>
            <dd className="font-mono">{webhook.remote_ip}</dd>
          </>}
        </dl>
        {webhook.request_headers && Object.keys(webhook.request_headers).length > 0 && (
          <RequestHeadersDetails
            headers={webhook.request_headers}
            count={Object.keys(webhook.request_headers).length}
          />
        )}
      </AccordionSection>

      {webhook.schema_drift?.has_drift && (
        <AccordionSection
          id="drift"
          title="スキーマドリフト"
          defaultOpen={false}
          badge={webhook.schema_drift.risk_level === "high"
            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300">高リスク</span>
            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300">検知</span>
          }
        >
          <div className="space-y-2 text-sm">
            {webhook.schema_drift.added && webhook.schema_drift.added.length > 0 && (
              <div><span className="font-medium text-green-400">追加:</span> <span className="font-mono">{webhook.schema_drift.added.join(", ")}</span></div>
            )}
            {webhook.schema_drift.removed && webhook.schema_drift.removed.length > 0 && (
              <div><span className="font-medium text-red-400">削除:</span> <span className="font-mono">{webhook.schema_drift.removed.join(", ")}</span></div>
            )}
            {webhook.schema_drift.type_changed && webhook.schema_drift.type_changed.length > 0 && (
              <div>
                <span className="font-medium text-amber-400">型変更:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {webhook.schema_drift.type_changed.map((tc, i) => (
                    <li key={i} className="font-mono text-xs">{tc.path}: {tc.expected_type} → {tc.actual_type}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      <AccordionSection id="payload" title="Payload" defaultOpen={true}>
        <PayloadTable
          data={webhook.payload}
          templateDescriptions={
            fieldTemplate?.fields?.length
              ? new Map(fieldTemplate.fields.map((f) => [f.path, f.description]))
              : undefined
          }
          analysisDescriptions={analysis?.field_descriptions}
          knownFieldPaths={
            fieldTemplate?.fields?.length
              ? new Set(fieldTemplate.fields.map((f) => f.path))
              : undefined
          }
        />
      </AccordionSection>

      {analysis && (
        <AccordionSection
          id="analysis"
          title="AI 分析結果"
          defaultOpen={false}
          badge={analysisFailed ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300">失敗</span> : undefined}
        >
          {analysis.summary && (
            <p className={`mb-3 text-sm ${analysisFailed ? "text-red-400" : "text-slate-300"}`}>{analysis.summary}</p>
          )}
          {/* US-120: 再分析ボタンは 1 箇所のみ（下の AnalyzeButton に集約） */}
        </AccordionSection>
      )}

      {analyzeError && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3">
          <p className="text-red-300 text-sm font-medium">分析の実行に失敗しました</p>
          <p className="text-xs text-red-400 mt-1">{analyzeError}</p>
        </div>
      )}

      {/* US-120: ゴーストスタイル（枠線+テキスト、DIM テーマ調和）、再分析は 1 箇所のみ */}
      <div className="mb-4">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="rounded border border-slate-400 dark:border-slate-500 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? "分析中..." : analyzeError ? "再試行" : analysis ? "再分析を実行" : "AI で分析"}
        </button>
      </div>
    </div>
  );
}
