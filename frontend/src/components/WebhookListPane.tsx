/**
 * 左ペイン: Webhook 一覧リスト（webhook.site 風コンパクト表示）
 * US-111: 2ペインレイアウトの左側
 * US-119: フィルタ縦積み、source アイコン、コンパクト行、source プルダウン
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useWebhookWebSocket } from "../hooks/useWebhookWebSocket";
import {
  listWebhooks,
  getStats,
  type WebhookListItem,
} from "../services/api";
import { SourceIcon } from "./SourceIcon";

const PAGE_SIZE = 50;

interface WebhookListPaneProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterSource: string;
  filterEventType: string;
  onFilterSourceChange: (v: string) => void;
  onFilterEventTypeChange: (v: string) => void;
  searchQuery?: string;
}

export function WebhookListPane({
  selectedId,
  onSelect,
  filterSource,
  filterEventType,
  onFilterSourceChange,
  onFilterEventTypeChange,
  searchQuery = "",
}: WebhookListPaneProps) {
  const [items, setItems] = useState<WebhookListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [newArrivalIds, setNewArrivalIds] = useState<Set<string>>(new Set());
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const webhookReceiveUrl = `${window.location.origin}/api/webhooks/receive`;

  const copyWebhookUrl = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(webhookReceiveUrl);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }, [webhookReceiveUrl]);

  const loadRef = useRef<(newId?: string) => void>(() => {});

  async function load(newId?: string) {
    setLoading(true);
    try {
      const res = await listWebhooks({
        source: filterSource || undefined,
        event_type: filterEventType || undefined,
        q: searchQuery.trim() || undefined,
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

  useEffect(() => { load(); }, [filterSource, filterEventType, searchQuery, page]);

  useEffect(() => {
    getStats()
      .then((s) => setAvailableSources(Object.keys(s.by_source).sort()))
      .catch(() => setAvailableSources([]));
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-dim-border">
        {/* US-155: Webhook 受信 URL 表示とコピー */}
        <div
          className="mb-2 flex items-center gap-2 rounded bg-slate-100 dark:bg-slate-800/50 px-2 py-1.5 min-w-0 cursor-pointer"
          title="クリックでコピー"
          onClick={copyWebhookUrl}
          onKeyDown={(e) => e.key === "Enter" && copyWebhookUrl()}
          role="button"
          tabIndex={0}
        >
          <code className="flex-1 truncate text-[10px] text-slate-600 dark:text-slate-400">
            {webhookReceiveUrl}
          </code>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); copyWebhookUrl(); }}
            className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            title="コピー"
          >
            {urlCopied ? (
              <span className="text-[10px] text-green-600 dark:text-green-400">✓</span>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
        </div>
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
        {/* US-119: 縦積みで 200px 幅でも崩れない、source はプルダウン+テキスト入力可 */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="relative min-w-0">
            <input
              type="text"
              placeholder="source"
              value={filterSource}
              onChange={(e) => onFilterSourceChange(e.target.value)}
              onFocus={() => setSourceDropdownOpen(true)}
              onBlur={() => setTimeout(() => setSourceDropdownOpen(false), 150)}
              className="w-full min-w-0 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-2 py-1 text-xs"
            />
            {sourceDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-0.5 max-h-32 overflow-y-auto rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-10"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  type="button"
                  onClick={() => { onFilterSourceChange(""); setSourceDropdownOpen(false); }}
                  className="block w-full px-2 py-1 text-left text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  （クリア）
                </button>
                {availableSources
                  .filter((s) => !filterSource || s.toLowerCase().includes(filterSource.toLowerCase()))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { onFilterSourceChange(s); setSourceDropdownOpen(false); }}
                      className="block w-full px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="event_type"
            value={filterEventType}
            onChange={(e) => onFilterEventTypeChange(e.target.value)}
            className="w-full min-w-0 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            {searchQuery.trim() ? "該当する Webhook がありません" : "Webhook がありません"}
          </div>
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
                className={`px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/40 cursor-pointer transition-colors text-xs flex items-start gap-2 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-400"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                } ${isNew ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
              >
                <SourceIcon source={w.source} size="w-5 h-5 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-medium text-blue-500 dark:text-blue-400">
                        {w.sequence_index != null ? `#${w.sequence_index}` : `#${String(w.id).slice(0, 6)}`}
                      </span>
                      {w.matched_rules && w.matched_rules.length > 0 && (
                        <span
                          className="text-[10px] px-1 py-0.5 rounded bg-amber-900/50 text-amber-200"
                          title={w.matched_rules.map((r) => r.name).join(", ")}
                        >
                          ⚠ {w.matched_rules.length}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 dark:text-dim-text-muted truncate text-right">
                      {w.http_method || "POST"} {w.remote_ip || ""}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-slate-700 dark:text-slate-300">
                    {w.source} / {w.event_type}
                  </div>
                  <div className="mt-0.5 text-slate-400 dark:text-dim-text-muted">
                    {new Date(w.received_at).toLocaleString()}
                  </div>
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
