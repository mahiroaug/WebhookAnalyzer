/**
 * 左ペイン: Webhook 一覧リスト（webhook.site 風コンパクト表示）
 * US-111: 2ペインレイアウトの左側
 */
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useWebhookWebSocket } from "../hooks/useWebhookWebSocket";
import {
  listWebhooks,
  type WebhookListItem,
} from "../services/api";

const PAGE_SIZE = 50;

interface WebhookListPaneProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterSource: string;
  filterEventType: string;
  onFilterSourceChange: (v: string) => void;
  onFilterEventTypeChange: (v: string) => void;
}

export function WebhookListPane({
  selectedId,
  onSelect,
  filterSource,
  filterEventType,
  onFilterSourceChange,
  onFilterEventTypeChange,
}: WebhookListPaneProps) {
  const [items, setItems] = useState<WebhookListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [newArrivalIds, setNewArrivalIds] = useState<Set<string>>(new Set());

  const loadRef = useRef<(newId?: string) => void>(() => {});

  async function load(newId?: string) {
    setLoading(true);
    try {
      const res = await listWebhooks({
        source: filterSource || undefined,
        event_type: filterEventType || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
      if (newId && res.items.some((w) => w.id === newId)) {
        setNewArrivalIds((prev) => new Set(prev).add(newId));
        setTimeout(() => {
          setNewArrivalIds((p) => { const n = new Set(p); n.delete(newId); return n; });
        }, 3000);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }
  loadRef.current = load;

  const { connected, reconnect } = useWebhookWebSocket((newId) => {
    loadRef.current(newId);
  });

  useEffect(() => { load(); }, [filterSource, filterEventType, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-dim-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-dim-text-muted">
            INBOX ({total})
          </span>
          <span className={`inline-flex items-center gap-1 text-xs ${
            connected ? "text-green-500" : "text-slate-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-slate-400"}`} />
            {connected ? "Live" : "Off"}
            {!connected && (
              <button onClick={reconnect} className="ml-1 underline text-xs">再接続</button>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="source"
            value={filterSource}
            onChange={(e) => onFilterSourceChange(e.target.value)}
            className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-2 py-1 text-xs"
          />
          <input
            type="text"
            placeholder="event_type"
            value={filterEventType}
            onChange={(e) => onFilterEventTypeChange(e.target.value)}
            className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">Webhook がありません</div>
        ) : (
          items.map((w) => {
            const isNew = newArrivalIds.has(w.id);
            const isSelected = w.id === selectedId;
            return (
              <motion.div
                key={w.id}
                initial={isNew ? { opacity: 0, x: -16 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelect(w.id)}
                className={`px-3 py-2 border-b border-slate-100 dark:border-slate-700/40 cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-400"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                } ${isNew ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-medium text-blue-500 dark:text-blue-400">
                    {w.sequence_index != null ? `#${w.sequence_index}` : `#${String(w.id).slice(0, 6)}`}
                  </span>
                  <span className="text-slate-400 dark:text-dim-text-muted truncate">
                    {w.http_method || "POST"} {w.remote_ip || ""}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-slate-700 dark:text-slate-300">
                  {w.source} / {w.event_type}
                </div>
                <div className="mt-0.5 text-slate-400 dark:text-dim-text-muted">
                  {new Date(w.received_at).toLocaleString()}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-dim-border flex items-center justify-between text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
          >
            前
          </button>
          <span className="text-slate-500">{page}/{totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
          >
            次
          </button>
        </div>
      )}
    </div>
  );
}
