/**
 * 複数 Webhook の比較ビュー。差分フィールドを強調表示。
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getWebhook, type WebhookDetail } from "../services/api";

function flattenPayload(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenPayload(val as Record<string, unknown>, path));
    } else {
      result[path] = JSON.stringify(val);
    }
  }
  return result;
}

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.getAll("id").slice(0, 5);
  const [webhooks, setWebhooks] = useState<WebhookDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length < 2) {
      setLoading(false);
      setError("比較するには2件以上選択してください");
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          ids.map((id) => getWebhook(id))
        );
        if (!cancelled) setWebhooks(results);
      } catch (e) {
        if (!cancelled) {
          setWebhooks([]);
          setError(e instanceof Error ? e.message : "取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [ids.join(",")]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  if (error || webhooks.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
        >
          ← 一覧へ
        </Link>
        <p className="text-red-600 dark:text-red-400">{error || "2件以上選択してください"}</p>
      </div>
    );
  }

  const allPaths = new Set<string>();
  const flatPayloads = webhooks.map((w) => {
    const flat = flattenPayload(w.payload);
    Object.keys(flat).forEach((k) => allPaths.add(k));
    return flat;
  });

  const sortedPaths = [...allPaths].sort();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <header className="mb-6">
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block"
        >
          ← 一覧へ
        </Link>
        <h1 className="text-2xl font-bold">比較ビュー</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {webhooks.length} 件の Webhook を比較（差分フィールドを強調）
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left p-3 font-medium bg-slate-100 dark:bg-slate-800 min-w-[180px]">
                フィールド
              </th>
              {webhooks.map((w) => (
                <th
                  key={w.id}
                  className="text-left p-3 font-medium bg-slate-100 dark:bg-slate-800 min-w-[200px]"
                >
                  <Link
                    to={`/webhooks/${w.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {w.source} / {w.event_type}
                  </Link>
                  <br />
                  <span className="text-xs text-slate-500 font-normal">
                    {new Date(w.received_at).toLocaleString()}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPaths.map((path) => {
              const values = flatPayloads.map((flat) => flat[path] ?? "—");
              const allSame =
                values.length > 1 &&
                values.every((v) => v === values[0]);
              return (
                <tr
                  key={path}
                  className={`border-b border-slate-100 dark:border-slate-700/50 ${
                    !allSame ? "bg-amber-50 dark:bg-amber-900/20" : ""
                  }`}
                >
                  <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {path}
                    {!allSame && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                        差分
                      </span>
                    )}
                  </td>
                  {values.map((val, i) => (
                    <td
                      key={i}
                      className={`p-3 font-mono text-xs break-all ${
                        !allSame ? "text-amber-800 dark:text-amber-200" : ""
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
