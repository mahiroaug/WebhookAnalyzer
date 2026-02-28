import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getWebhook,
  getAnalysis,
  triggerAnalyze,
  type WebhookDetail,
  type WebhookAnalysisResponse,
} from "../services/api";

export function WebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null);
  const [analysis, setAnalysis] = useState<WebhookAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [detailRes, analysisRes] = await Promise.all([
          getWebhook(id),
          getAnalysis(id),
        ]);
        if (!cancelled) {
          setWebhook(detailRes);
          setAnalysis(analysisRes ?? null);
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
    try {
      const res = await triggerAnalyze(id);
      setAnalysis(res);
    } finally {
      setAnalyzing(false);
    }
  }

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
        <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">
          {webhook.source} / {webhook.event_type}
        </p>
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

      {analysis && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-2">分析結果</h2>
          {analysis.summary && (
            <p className="mb-3 text-slate-700 dark:text-slate-300">{analysis.summary}</p>
          )}
          {analysis.field_descriptions && Object.keys(analysis.field_descriptions).length > 0 && (
            <dl className="space-y-1 text-sm">
              {Object.entries(analysis.field_descriptions).map(([key, desc]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-mono text-indigo-600 dark:text-indigo-400 font-medium min-w-[120px]">{key}</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{desc}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold mb-2">Payload (JSON)</h2>
        <pre className="text-xs overflow-x-auto p-4 bg-slate-100 dark:bg-slate-900 rounded">
          {JSON.stringify(webhook.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
