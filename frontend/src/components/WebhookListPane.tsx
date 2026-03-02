/**
 * 左ペイン: Webhook 一覧リスト（webhook.site 風コンパクト表示）
 * US-111: 2ペインレイアウトの左側
 * US-119: フィルタ縦積み、source アイコン、コンパクト行、source プルダウン
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useWebhookWebSocket } from "../hooks/useWebhookWebSocket";
import { useDebounce } from "../hooks/useDebounce";
import {
  listWebhooks,
  getFilterOptions,
  markWebhookRead,
  markAllWebhooksRead,
  reclassifyAll,
  toggleWebhookFavorite,
  type WebhookListItem,
} from "../services/api";
import { SourceIcon } from "./SourceIcon";
import { ServiceStatusPanel } from "./ServiceStatusPanel";
import { formatReceivedAt } from "../utils/formatDate";

/** 新着 Webhook の通知音（即時再生、同一 ID と連続到着を抑制） */
let _seCooldown = 0;
let _seLastId = "";
function playNewArrivalSound(id: string) {
  const now = Date.now();
  if (id === _seLastId || now - _seCooldown < 2000) return;
  _seCooldown = now;
  _seLastId = id;
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.7);
    osc.onended = () => ctx.close();
  } catch {
    /* autoplay policy でブロックされた場合は無視 */
  }
}

/** US-161: 一覧ペインの表示件数拡大（500 件） */
const PAGE_SIZE = 500;

interface WebhookListPaneProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterSource: string;
  filterEventType: string;
  onFilterSourceChange: (v: string) => void;
  onFilterEventTypeChange: (v: string) => void;
  searchQuery?: string;
  /** 詳細ペインで既読にされた ID（リストの表示を同期するため） */
  markedReadFromDetail?: string | null;
}

export function WebhookListPane({
  selectedId,
  onSelect,
  filterSource,
  filterEventType,
  onFilterSourceChange,
  onFilterEventTypeChange,
  searchQuery = "",
  markedReadFromDetail = null,
}: WebhookListPaneProps) {
  const [items, setItems] = useState<WebhookListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [newArrivalIds, setNewArrivalIds] = useState<Set<string>>(new Set());
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [eventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false); // US-167
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false); // US-179
  const [markingAll, setMarkingAll] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("webhook-se-muted") === "1"; } catch { return false; }
  });

  const loadRef = useRef<(newId?: string) => void>(() => {});
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  /** US-164: 300ms デバウンスで API 呼び出しを抑制 */
  const debouncedSource = useDebounce(filterSource, 300);
  const debouncedEventType = useDebounce(filterEventType, 300);

  const handleItemClick = useCallback(
    (item: WebhookListItem) => {
      if (!item.is_read) {
        markWebhookRead(item.id).catch(() => {});
        setItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, is_read: true } : w)));
      }
      onSelect(item.id);
    },
    [onSelect],
  );

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent, item: WebhookListItem) => {
      e.stopPropagation();
      toggleWebhookFavorite(item.id)
        .then((res) => {
          setItems((prev) =>
            prev.map((w) =>
              w.id === item.id ? { ...w, is_favorite: res.is_favorite } : w,
            ),
          );
        })
        .catch(() => {});
    },
    [],
  );

  async function load(newId?: string) {
    setLoading(true);
    try {
      // US-156: 新着時は 1 ページ目を表示（新着は最新順の先頭に来る）
      const effectivePage = newId ? 1 : page;
      if (newId && page !== 1) setPage(1);
      const res = await listWebhooks({
        source: debouncedSource || undefined,
        event_type: debouncedEventType || undefined,
        q: searchQuery.trim() || undefined,
        is_read: filterUnreadOnly ? false : undefined,
        is_favorite: filterFavoritesOnly ? true : undefined,
        limit: PAGE_SIZE,
        offset: (effectivePage - 1) * PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
      if (newId && res.items.some((w) => w.id === newId)) {
        if (!mutedRef.current) playNewArrivalSound(newId);
        setNewArrivalIds((prev) => new Set(prev).add(newId));
        setTimeout(() => {
          setNewArrivalIds((p) => {
            const n = new Set(p);
            n.delete(newId);
            return n;
          });
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

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllWebhooksRead({
        source: debouncedSource || undefined,
        event_type: debouncedEventType || undefined,
        q: searchQuery.trim() || undefined,
      });
      load();
    } finally {
      setMarkingAll(false);
    }
  }, [debouncedSource, debouncedEventType, searchQuery]);

  const handleReclassifyAll = useCallback(async () => {
    setReclassifying(true);
    try {
      const result = await reclassifyAll();
      if (result.reclassified > 0) {
        load();
      }
    } finally {
      setReclassifying(false);
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load uses debouncedSource, debouncedEventType, searchQuery, page, filterUnreadOnly, filterFavoritesOnly from closure
  }, [debouncedSource, debouncedEventType, searchQuery, page, filterUnreadOnly, filterFavoritesOnly]);

  const { connected, status, reconnect } = useWebhookWebSocket((newId) => {
    loadRef.current(newId);
  });

  /** US-175: source/event_type に応じてフィルタ候補を相互連動 */
  useEffect(() => {
    const src = filterSource.trim() || undefined;
    const evt = filterEventType.trim() || undefined;
    getFilterOptions({ source: src ?? null, event_type: evt ?? null })
      .then((opts) => {
        setAvailableSources(opts.sources);
        setAvailableEventTypes(opts.event_types);
      })
      .catch(() => {
        setAvailableSources([]);
        setAvailableEventTypes([]);
      });
  }, [filterSource, filterEventType]);

  /** 詳細ペインで既読にされたらリストの表示を更新 */
  useEffect(() => {
    if (markedReadFromDetail) {
      setItems((prev) =>
        prev.map((w) =>
          w.id === markedReadFromDetail ? { ...w, is_read: true } : w,
        ),
      );
    }
  }, [markedReadFromDetail]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-dim-border min-w-0">
        {/* 情報部: 詳細ペインとデザイン言語を統一 */}
        <div className="mb-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden min-w-0">
          <ServiceStatusPanel />
        </div>
        {/* US-167: Unread Only フィルタ / US-179: Favorites Only / Mark All Read / ミュート */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded border-slate-400"
            />
            Unread Only
          </label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={filterFavoritesOnly}
              onChange={(e) => setFilterFavoritesOnly(e.target.checked)}
              className="rounded border-slate-400"
            />
            Favorites Only
          </label>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || !items.some((w) => !w.is_read)}
            className={`text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 ${
              items.some((w) => !w.is_read) ? "" : "invisible"
            }`}
          >
            {markingAll ? "..." : "Mark All Read"}
          </button>
          {items.some((w) => w.source === "unknown") && (
            <button
              type="button"
              onClick={handleReclassifyAll}
              disabled={reclassifying}
              className="text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {reclassifying ? "..." : "Reclassify All"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              try { localStorage.setItem("webhook-se-muted", next ? "1" : "0"); } catch {}
            }}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 transition-colors"
            title={muted ? "通知音オン" : "通知音オフ"}
          >
            {muted ? "🔇" : "🔔"}
          </button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-dim-text-muted">
            INBOX ({total})
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              connected
                ? "text-green-500"
                : status === "reconnecting"
                  ? "text-amber-500"
                  : "text-slate-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? "bg-green-500"
                  : status === "reconnecting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-400"
              }`}
            />
            {connected
              ? "Live"
              : status === "connecting"
                ? "接続中..."
                : status === "reconnecting"
                  ? "再接続中..."
                  : "切断"}
            {!connected && status !== "connecting" && status !== "reconnecting" && (
              <button onClick={reconnect} className="ml-1 underline text-xs">
                再接続
              </button>
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
                  onClick={() => {
                    onFilterSourceChange("");
                    setSourceDropdownOpen(false);
                  }}
                  className="block w-full px-2 py-1 text-left text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  （クリア）
                </button>
                {availableSources
                  .filter(
                    (s) => !filterSource || s.toLowerCase().includes(filterSource.toLowerCase()),
                  )
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onFilterSourceChange(s);
                        setSourceDropdownOpen(false);
                      }}
                      className="block w-full px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="relative min-w-0">
            <input
              type="text"
              placeholder="event_type"
              value={filterEventType}
              onChange={(e) => onFilterEventTypeChange(e.target.value)}
              onFocus={() => setEventTypeDropdownOpen(true)}
              onBlur={() => setTimeout(() => setEventTypeDropdownOpen(false), 150)}
              className="w-full min-w-0 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-2 py-1 text-xs"
            />
            {eventTypeDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-0.5 max-h-32 overflow-y-auto rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-10"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onFilterEventTypeChange("");
                    setEventTypeDropdownOpen(false);
                  }}
                  className="block w-full px-2 py-1 text-left text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  （クリア）
                </button>
                {availableEventTypes
                  .filter(
                    (et) =>
                      !filterEventType || et.toLowerCase().includes(filterEventType.toLowerCase()),
                  )
                  .map((et) => (
                    <button
                      key={et}
                      type="button"
                      onClick={() => {
                        onFilterEventTypeChange(et);
                        setEventTypeDropdownOpen(false);
                      }}
                      className="block w-full px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {et}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            {filterFavoritesOnly
              ? "No favorites yet"
              : searchQuery.trim()
                ? "該当する Webhook がありません"
                : "Webhook がありません"}
          </div>
        ) : (
          items.map((w) => {
            const isNew = newArrivalIds.has(w.id);
            const isSelected = w.id === selectedId;
            const isUnread = !w.is_read;
            return (
              <motion.div
                key={w.id}
                initial={isNew ? { opacity: 0, x: -80 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  isNew
                    ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 0.15 }
                }
                onClick={() => handleItemClick(w)}
                className={`px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/40 cursor-pointer transition-colors flex items-start gap-2 ${
                  isSelected
                    ? "text-xs bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-400"
                    : isUnread
                      ? "text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      : "text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                } ${isNew ? "new-arrival-glow" : isUnread ? "unread-glow" : ""}`}
              >
                <button
                  type="button"
                  onClick={(e) => handleFavoriteClick(e, w)}
                  className="shrink-0 mt-0.5 text-amber-400 hover:text-amber-300 transition-colors focus:outline-none"
                  title={w.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  aria-label={w.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {w.is_favorite ? "★" : "☆"}
                </button>
                <SourceIcon source={w.source} size="w-5 h-5 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-medium text-blue-500 dark:text-blue-400">
                        {w.sequence_index != null
                          ? `#${w.sequence_index}`
                          : `#${String(w.id).slice(0, 6)}`}
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
                    {formatReceivedAt(w.received_at)}
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
            Prev
          </button>
          <span className="text-slate-500">
            {page}/{totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
