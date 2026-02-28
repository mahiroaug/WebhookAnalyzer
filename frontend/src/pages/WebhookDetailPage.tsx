import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getWebhook,
  getAnalysis,
  getFieldTemplate,
  triggerAnalyze,
  type WebhookDetail,
  type WebhookAnalysisResponse,
  type FieldTemplateResponse,
} from "../services/api";
import { JsonTreeView } from "../components/JsonTreeView";

export function WebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null);
  const [analysis, setAnalysis] = useState<WebhookAnalysisResponse | null>(null);
  const [fieldTemplate, setFieldTemplate] = useState<FieldTemplateResponse | null>(null);
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
        const [detailRes, analysisRes] = await Promise.all([
          getWebhook(webhookId),
          getAnalysis(webhookId),
        ]);
        if (!cancelled) {
          setWebhook(detailRes);
          setAnalysis(analysisRes ?? null);
          const templateRes = await getFieldTemplate(
            detailRes.source,
            detailRes.event_type
          );
          if (!cancelled) setFieldTemplate(templateRes ?? null);
        }
      } catch {
        if (!cancelled) setWebhook(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="text-slate-500">
          {loading ? "読み込み中..." : "Webhook が見つかりません"}
        </div>
        <Link to="/" className="text-indigo-600 mt-4 inline-block">← 一覧へ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <header className="mb-6">
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
          ← 一覧へ
        </Link>
        <h1 className="text-2xl font-bold">Webhook 詳細</h1>
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
          className="rounded bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <dt className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
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
                      className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
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
                    <dt className="font-mono text-indigo-600 dark:text-indigo-400 font-medium min-w-[120px]">
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

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold mb-3">Payload (JSON)</h2>
        <div className="text-sm font-mono overflow-x-auto p-4 bg-slate-100 dark:bg-slate-900 rounded min-h-[120px]">
          <JsonTreeView
            data={webhook.payload}
            rootKey="payload"
            showMissingImportant
            knownFieldPaths={
              fieldTemplate?.fields?.length
                ? new Set(fieldTemplate.fields.map((f) => f.path))
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
