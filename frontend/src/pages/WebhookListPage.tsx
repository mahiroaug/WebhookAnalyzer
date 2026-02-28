import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatsCards } from "../components/StatsCards";
import {
  listWebhooks,
  getStats,
  type StatsResponse,
  type WebhookListItem,
} from "../services/api";

export function WebhookListPage() {
  const [items, setItems] = useState<WebhookListItem[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState("");
  const [filterEventType, setFilterEventType] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [listRes, statsRes] = await Promise.all([
          listWebhooks({
            source: filterSource || undefined,
            event_type: filterEventType || undefined,
          }),
          getStats(),
        ]);
        if (!cancelled) {
          setItems(listRes);
          setStats(statsRes);
        }
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filterSource, filterEventType]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Webhook Analyzer</h1>
        <p className="text-slate-600 dark:text-slate-400">受信した Webhook の一覧</p>
      </header>

      <StatsCards stats={stats} />

      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="source で絞り込み"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="event_type で絞り込み"
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-slate-500">読み込み中...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Event Type</th>
                <th className="text-left p-3 font-medium">受信日時</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                  <td className="p-3">
                    <Link
                      to={`/webhooks/${w.id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-xs"
                    >
                      {w.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="p-3">{w.source}</td>
                  <td className="p-3">{w.event_type}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {new Date(w.received_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-500">Webhook がありません</div>
          )}
        </div>
      )}
    </div>
  );
}
