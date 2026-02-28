import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { StatsCards } from "../components/StatsCards";
import { useWebhookWebSocket } from "../hooks/useWebhookWebSocket";
import {
  listWebhooks,
  getStats,
  batchAnalyze,
  listSessions,
  createSession,
  addWebhookToSession,
  type StatsResponse,
  type WebhookListItem,
  type Session,
} from "../services/api";

const PAGE_SIZE = 20;

export function WebhookListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<WebhookListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState(
    () => searchParams.get("source") ?? ""
  );
  const [filterEventType, setFilterEventType] = useState(
    () => searchParams.get("event_type") ?? ""
  );
  const [filterAnalyzed, setFilterAnalyzed] = useState<
    "all" | "analyzed" | "unanalyzed"
  >(() => {
    const a = searchParams.get("analyzed");
    return a === "true" ? "analyzed" : a === "false" ? "unanalyzed" : "all";
  });
  const [filterHasDrift, setFilterHasDrift] = useState<"all" | "yes" | "no">(
    () => {
      const d = searchParams.get("has_drift");
      return d === "true" ? "yes" : d === "false" ? "no" : "all";
    }
  );
  const [filterSession, setFilterSession] = useState(
    () => searchParams.get("session_id") ?? ""
  );
  const [page, setPage] = useState(() =>
    Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [newArrivalIds, setNewArrivalIds] = useState<Set<string>>(new Set());
  const [soundMuted, setSoundMuted] = useState(
    () => localStorage.getItem("webhook-sound-muted") === "1"
  );
  const [batchResult, setBatchResult] = useState<{
    completed: number;
    failed: number;
  } | null>(null);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToCompare = () => {
    if (selectedIds.size >= 2) {
      const ids = [...selectedIds].slice(0, 5);
      navigate(`/compare?${ids.map((id) => `id=${id}`).join("&")}`);
    }
  };

  const runBatchAnalyze = async () => {
    const idsToAnalyze =
      selectedIds.size > 0
        ? [...selectedIds]
        : items.filter((w) => !w.analyzed).map((w) => w.id);
    if (idsToAnalyze.length === 0) return;
    setBatchAnalyzing(true);
    setBatchResult(null);
    try {
      const res = await batchAnalyze(idsToAnalyze);
      setBatchResult({ completed: res.completed, failed: res.failed });
      setSelectedIds(new Set());
      load();
    } catch (e) {
      setBatchResult({
        completed: 0,
        failed: idsToAnalyze.length,
      });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filterSource, filterEventType, filterAnalyzed, filterHasDrift, filterSession]);

  useEffect(() => {
    listSessions().then((r) => setSessions(r.sessions)).catch(() => {});
  }, []);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    try {
      const s = await createSession(newSessionName.trim());
      setSessions((prev) => [s, ...prev]);
      setNewSessionName("");
    } catch {
      // ignore
    }
  };

  const handleAddToSession = async (sessionId: string) => {
    for (const id of selectedIds) {
      await addWebhookToSession(sessionId, id);
    }
    setSelectedIds(new Set());
    load();
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterSource) params.set("source", filterSource);
    if (filterEventType) params.set("event_type", filterEventType);
    if (filterAnalyzed !== "all") params.set("analyzed", filterAnalyzed);
    if (filterHasDrift !== "all")
      params.set("has_drift", filterHasDrift === "yes" ? "true" : "false");
    if (filterSession) params.set("session_id", filterSession);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [filterSource, filterEventType, filterAnalyzed, filterHasDrift, filterSession, page, setSearchParams]);

  const [linkCopied, setLinkCopied] = useState(false);
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const loadRef = useRef<(newId?: string) => void>(() => {});
  const playNewArrivalSound = useCallback(() => {
    if (soundMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // 効果音失敗は無視
    }
  }, [soundMuted]);

  async function load(newId?: string) {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        listWebhooks({
            source: filterSource || undefined,
            event_type: filterEventType || undefined,
            analyzed:
              filterAnalyzed === "analyzed"
                ? true
                : filterAnalyzed === "unanalyzed"
                  ? false
                  : undefined,
            has_drift:
              filterHasDrift === "yes"
                ? true
                : filterHasDrift === "no"
                  ? false
                  : undefined,
            session_id: filterSession || undefined,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
          }),
        getStats(),
      ]);
      setItems(listRes.items);
      setTotal(listRes.total);
      setStats(statsRes);
      if (newId && listRes.items.some((w) => w.id === newId)) {
        setNewArrivalIds((prev) => new Set(prev).add(newId));
        playNewArrivalSound();
        setTimeout(() => {
          setNewArrivalIds((p) => {
            const next = new Set(p);
            next.delete(newId);
            return next;
          });
        }, 3000);
      }
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }
  loadRef.current = load;

  const { connected, reconnect } = useWebhookWebSocket((newId) => {
    loadRef.current(newId);
  });

  useEffect(() => {
    load();
  }, [filterSource, filterEventType, filterAnalyzed, filterHasDrift, filterSession, page]);

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Webhook 一覧</h1>
            <p className="text-slate-600 dark:text-slate-400">受信した Webhook の一覧</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSoundMuted((m) => {
                  const next = !m;
                  localStorage.setItem("webhook-sound-muted", next ? "1" : "0");
                  return next;
                });
              }}
              className={`p-2 rounded text-xs ${
                soundMuted
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  : "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
              }`}
              title={soundMuted ? "効果音を有効にする" : "効果音をミュート"}
            >
              {soundMuted ? "🔕" : "🔔"}
            </button>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                connected
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-slate-500"
                }`}
              />
              {connected ? "リアルタイム接続中" : "切断"}
            </span>
            {!connected && (
              <button
                onClick={reconnect}
                className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                再接続
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex gap-4">
          <Link
            to="/by-event-type"
            className="text-sm text-blue-400 hover:underline"
          >
            event_type 別に表示 →
          </Link>
          <a
            href="/api/webhooks/report/markdown"
            download="webhook-report.md"
            className="text-sm text-blue-400 hover:underline"
          >
            レポート出力 (.md)
          </a>
          {selectedIds.size >= 2 && (
            <button
              onClick={goToCompare}
              className="text-sm rounded bg-blue-500 text-white px-3 py-1.5 hover:bg-blue-600"
            >
              比較 ({selectedIds.size}件)
            </button>
          )}
          {items.some((w) => !w.analyzed) && (
            <button
              onClick={runBatchAnalyze}
              disabled={batchAnalyzing}
              className="text-sm rounded bg-green-600 text-white px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
            >
              {batchAnalyzing
                ? "一括分析中..."
                : `一括分析 (${items.filter((w) => !w.analyzed).length}件)`}
            </button>
          )}
          <button
            onClick={copyShareLink}
            className="text-sm text-blue-400 hover:underline"
          >
            {linkCopied ? "コピーしました" : "共有リンクをコピー"}
          </button>
        </div>
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
        <select
          value={filterAnalyzed}
          onChange={(e) =>
            setFilterAnalyzed(
              e.target.value as "all" | "analyzed" | "unanalyzed"
            )
          }
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        >
          <option value="all">分析状態: すべて</option>
          <option value="analyzed">分析済みのみ</option>
          <option value="unanalyzed">未分析のみ</option>
        </select>
        <select
          value={filterHasDrift}
          onChange={(e) =>
            setFilterHasDrift(e.target.value as "all" | "yes" | "no")
          }
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        >
          <option value="all">ドリフト: すべて</option>
          <option value="yes">ドリフトありのみ</option>
          <option value="no">ドリフトなし</option>
        </select>
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        >
          <option value="">セッション: すべて</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.webhook_count}件)
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="新規セッション名"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm w-40"
          />
          <button
            onClick={handleCreateSession}
            disabled={!newSessionName.trim()}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-50"
          >
            作成
          </button>
        </div>
        {selectedIds.size > 0 && (
          <select
            onChange={(e) => {
              const v = e.target.value;
              if (v) handleAddToSession(v);
              e.target.value = "";
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="">選択をセッションに追加...</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {batchResult && (
        <div className="mb-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-green-700 dark:text-green-300 font-medium">一括分析完了</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            完了: {batchResult.completed}件、失敗: {batchResult.failed}件
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300 font-medium">エラー</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          <button
            onClick={() => load()}
            className="mt-3 rounded bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      )}

      {loading ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="w-10 p-3" />
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Event Type</th>
                <th className="text-left p-3 font-medium">分析</th>
                <th className="text-left p-3 font-medium">受信日時</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="p-3">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 text-center text-slate-500 text-sm">読み込み中...</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Event Type</th>
                <th className="text-left p-3 font-medium">分析</th>
                <th className="text-left p-3 font-medium">受信日時</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => {
                const isNew = newArrivalIds.has(w.id);
                return (
                <motion.tr
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  initial={isNew ? { opacity: 0, x: -24 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => navigate(`/webhooks/${w.id}`)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && navigate(`/webhooks/${w.id}`)
                  }
                  className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    selectedIds.has(w.id) ? "bg-blue-900/20" : ""
                  } ${isNew ? "bg-emerald-900/30 dark:bg-emerald-800/30" : ""}`}
                >
                  <td className="p-3" onClick={(e) => toggleSelect(e, w.id)}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(w.id)}
                      onChange={() => {}}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="p-3 font-mono text-xs text-blue-400">
                    {String(w.id).slice(0, 8)}...
                  </td>
                  <td className="p-3">{w.source}</td>
                  <td className="p-3">{w.event_type}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        w.analyzed
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {w.analyzed ? "済" : "未"}
                    </span>
                  </td>
                  <td className="p-3">
                    {w.has_drift && (
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                        title="スキーマドリフト検知"
                      >
                        ドリフト
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {new Date(w.received_at).toLocaleString()}
                  </td>
                </motion.tr>
              );
              })}
            </tbody>
          </table>
          {items.length === 0 && !loading && (
            <div className="p-12 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Webhook がありません
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {filterSource || filterEventType || filterAnalyzed !== "all" || filterHasDrift !== "all" || filterSession
                  ? "指定した条件に一致する Webhook はありません。フィルタを解除してみましょう。"
                  : "外部サービス（Fireblocks, BitGo 等）の Webhook 送信先にこのシステムの URL を設定し、送信してみましょう。"}
              </p>
              <button
                onClick={() => {
                  if (filterSource || filterEventType || filterAnalyzed !== "all" || filterHasDrift !== "all" || filterSession) {
                    setFilterSource("");
                    setFilterEventType("");
                    setFilterAnalyzed("all");
                    setFilterHasDrift("all");
                    setFilterSession("");
                  } else {
                    load();
                  }
                }}
                className="mt-4 rounded bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600"
              >
                {filterSource || filterEventType || filterAnalyzed !== "all" || filterHasDrift !== "all" || filterSession ? "フィルタを解除" : "再読み込み"}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {total} 件中 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} 件を表示
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
