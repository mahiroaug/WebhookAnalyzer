import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getSchemaEstimate, type SchemaField } from "../services/api";

export function SchemaEstimatePage() {
  const [searchParams] = useSearchParams();
  const eventType = searchParams.get("event_type") ?? "";
  const source = searchParams.get("source") ?? "";
  const [data, setData] = useState<{
    event_type: string;
    source: string | null;
    total_samples: number;
    fields: SchemaField[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventType) {
      setLoading(false);
      setError("event_type を指定してください");
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getSchemaEstimate(
          eventType,
          source || undefined
        );
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [eventType, source]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <header className="mb-6">
        <Link
          to="/by-event-type"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block"
        >
          ← event_type 別一覧へ
        </Link>
        <h1 className="text-2xl font-bold">スキーマ推定</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {eventType}
          {source && ` (source: ${source})`} — {data?.total_samples ?? 0} 件のサンプルから推定
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {data && data.fields.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="text-left p-3 font-medium">フィールド</th>
                <th className="text-left p-3 font-medium">型</th>
                <th className="text-left p-3 font-medium">出現率</th>
                <th className="text-left p-3 font-medium">必須/任意</th>
              </tr>
            </thead>
            <tbody>
              {data.fields.map((f) => (
                <tr
                  key={f.path}
                  className="border-b border-slate-100 dark:border-slate-700/50"
                >
                  <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">
                    {f.path}
                  </td>
                  <td className="p-3">{f.type}</td>
                  <td className="p-3">
                    {(f.occurrence_rate * 100).toFixed(0)}%
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        f.required
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    >
                      {f.required ? "必須" : "任意"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.fields.length === 0 && !error && (
        <div className="p-8 text-center text-slate-500">
          スキーマを推定できませんでした
        </div>
      )}
    </div>
  );
}
