import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getGroupedByEventType,
  type EventTypeGroup,
} from "../services/api";
import { formatReceivedAt } from "../utils/formatDate";

export function EventTypeGroupPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<EventTypeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getGroupedByEventType();
        if (!cancelled) setGroups(res.groups);
      } catch (e) {
        if (!cancelled) {
          setGroups([]);
          setError(e instanceof Error ? e.message : "取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">event_type 別一覧</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          受信済み Webhook を event_type ごとにグルーピング
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {groups.length === 0 && !error ? (
        <div className="p-12 text-center text-slate-500">
          Webhook がありません
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.event_type}
              className={`rounded-lg border p-4 bg-white dark:bg-slate-800 ${
                g.is_known
                  ? "border-slate-200 dark:border-slate-700"
                  : "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold font-mono">
                    {g.event_type}
                  </h2>
                  {!g.is_known && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                      新規タイプ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    {g.count} 件
                  </span>
                  {g.count >= 3 && (
                    <Link
                      to={`/schema?event_type=${encodeURIComponent(g.event_type)}`}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      スキーマ推定
                    </Link>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  代表例:
                </p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/webhooks/${g.sample.id}`)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    navigate(`/webhooks/${g.sample.id}`)
                  }
                  className="flex items-center gap-4 p-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                >
                  <span className="font-mono text-xs text-blue-400">
                    {String(g.sample.id).slice(0, 8)}...
                  </span>
                  <span>{g.sample.source}</span>
                  <span className="text-slate-500">
                    {formatReceivedAt(g.sample.received_at)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      g.sample.analyzed
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {g.sample.analyzed ? "分析済" : "未"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
