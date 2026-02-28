import { useEffect, useState, useCallback } from "react";
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
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={!adjacent?.prev_id}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="前の Webhook（←）"
            >
              ← 前へ
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!adjacent?.next_id}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="次の Webhook（→）"
            >
              次へ →
            </button>
          </div>
          <h1 className="text-2xl font-bold">Webhook 詳細</h1>
        </div>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">source</dt>
          <dd className="font-mono">{webhook.source}</dd>
          <dt className="text-slate-500 dark:text-slate-400">event_type</dt>
          <dd className="font-mono">{webhook.event_type}</dd>
          <dt className="text-slate-500 dark:text-slate-400">group_key</dt>
          <dd className="font-mono">{webhook.group_key}</dd>
          <dt className="text-slate-500 dark:text-slate-400">received_at</dt>
          <dd className="font-mono">{new Date(webhook.received_at).toLocaleString()}</dd>
        </dl>
      </header>

      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="rounded bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? "分析中..." : "AI で分析"}
        </button>
      </div>

      {analyzeError && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300 font-medium">
            分析の実行に失敗しました
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {analyzeError}
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-3 rounded bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            再試行
          </button>
        </div>
      )}

      {webhook.schema_drift?.has_drift && (
        <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-800 p-4 bg-amber-50 dark:bg-amber-900/20">
          <h2 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
            スキーマドリフト検知
            {webhook.schema_drift?.risk_level === "high" && (
              <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                高リスク
              </span>
            )}
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            直近の基準スキーマとの差分
          </p>
          <div className="space-y-2 text-sm">
            {webhook.schema_drift?.added && webhook.schema_drift.added.length > 0 && (
              <div>
                <span className="font-medium text-green-700 dark:text-green-400">
                  追加:
                </span>{" "}
                <span className="font-mono">{webhook.schema_drift.added.join(", ")}</span>
              </div>
            )}
            {webhook.schema_drift?.removed && webhook.schema_drift.removed.length > 0 && (
              <div>
                <span className="font-medium text-red-700 dark:text-red-400">
                  削除:
                </span>{" "}
                <span className="font-mono">{webhook.schema_drift.removed.join(", ")}</span>
              </div>
            )}
            {webhook.schema_drift?.type_changed &&
              webhook.schema_drift.type_changed.length > 0 && (
                <div>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    型変更:
                  </span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    {webhook.schema_drift.type_changed.map((tc, i) => (
                      <li key={i} className="font-mono text-xs">
                        {tc.path}: {tc.expected_type} → {tc.actual_type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {fieldTemplate && fieldTemplate.fields.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-2">
            フィールド辞書（{fieldTemplate.source} / {fieldTemplate.event_type}）
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            主要フィールドの意味・注意点・参照先
          </p>
          <dl className="space-y-2 text-sm">
            {fieldTemplate.fields.map((f) => (
              <div key={f.path} className="flex flex-col gap-0.5">
                <dt className="font-mono font-medium text-blue-400">
                  {f.path}
                </dt>
                <dd className="text-slate-600 dark:text-slate-400 pl-2">
                  {f.description}
                  {f.notes && (
                    <span className="text-amber-600 dark:text-amber-400 ml-1">
                      （{f.notes}）
                    </span>
                  )}
                  {f.reference_url && (
                    <a
                      href={f.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:underline text-xs"
                    >
                      参照
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            テンプレートに未定義のフィールドは「未知」として表示され、辞書への追加候補として扱えます。
          </p>
        </div>
      )}

      {analysis && (
        <div
          className={`mb-6 rounded-lg border p-4 ${
            analysisFailed
              ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">分析結果</h2>
          {analysis.summary && (
            <p
              className={`mb-3 ${
                analysisFailed
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {analysis.summary}
            </p>
          )}
          {analysis.field_descriptions &&
            Object.keys(analysis.field_descriptions).length > 0 && (
              <dl className="space-y-1 text-sm">
                {Object.entries(analysis.field_descriptions).map(([key, desc]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="font-mono text-blue-400 font-medium min-w-[120px]">
                      {key}
                    </dt>
                    <dd className="text-slate-600 dark:text-slate-400">{desc}</dd>
                  </div>
                ))}
              </dl>
            )}
          {analysisFailed && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-3 rounded bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? "再分析中..." : "再分析を実行"}
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Payload</h2>
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
      </div>
    </div>
  );
}
