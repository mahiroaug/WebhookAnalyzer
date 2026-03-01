/**
 * US-174: 詳細ペインのナビゲーションバー（タブ直下に固定）
 * Prev / Next / Replay / Export PDF / #NNN
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { replayWebhook, exportWebhookPdf, type WebhookDetail } from "../services/api";

export interface DetailNavBarData {
  webhook: WebhookDetail;
  adjacent: { prev_id: string | null; next_id: string | null };
}

interface DetailNavBarProps {
  data: DetailNavBarData | null;
  searchQuery?: string;
}

export function DetailNavBar({ data, searchQuery = "" }: DetailNavBarProps) {
  const navigate = useNavigate();
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayUrl, setReplayUrl] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<{ status?: number; error?: string; elapsed?: number } | null>(null);

  const goPrev = useCallback(() => {
    if (data?.adjacent?.prev_id) {
      const search = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      navigate(`/webhooks/${data.adjacent.prev_id}${search}`);
    }
  }, [data?.adjacent?.prev_id, navigate, searchQuery]);

  const goNext = useCallback(() => {
    if (data?.adjacent?.next_id) {
      const search = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      navigate(`/webhooks/${data.adjacent.next_id}${search}`);
    }
  }, [data?.adjacent?.next_id, navigate, searchQuery]);

  const handleReplay = useCallback(async () => {
    if (!data?.webhook?.id || !replayUrl.trim()) return;
    setReplaying(true);
    setReplayResult(null);
    try {
      const res = await replayWebhook(data.webhook.id, replayUrl.trim());
      setReplayResult({
        status: res.status_code,
        elapsed: res.elapsed_ms,
        error: res.error ?? undefined,
      });
    } catch (e) {
      setReplayResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setReplaying(false);
    }
  }, [data?.webhook?.id, replayUrl]);

  if (!data) return null;

  const { webhook, adjacent } = data;

  return (
    <div className="shrink-0 border-b border-slate-200 dark:border-dim-border bg-white dark:bg-dim-card px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={goPrev}
            disabled={!adjacent?.prev_id}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            title="Previous Webhook (←)"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!adjacent?.next_id}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            title="Next Webhook (→)"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={() => {
              setReplayOpen((o) => !o);
              setReplayResult(null);
            }}
            className="rounded border border-slate-400 dark:border-slate-500 bg-transparent px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
          >
            Replay
          </button>
          <button
            type="button"
            onClick={() => exportWebhookPdf(webhook.id).catch((e) => alert(e?.message ?? "Export failed"))}
            className="rounded border border-slate-400 dark:border-slate-500 bg-transparent px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
          >
            Export PDF
          </button>
        </div>
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-dim-text-muted">
            {webhook.sequence_index != null ? `#${webhook.sequence_index}` : ""}
          </span>
          {webhook.matched_rules && webhook.matched_rules.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-200"
              title={webhook.matched_rules.map((r) => r.name).join(", ")}
            >
              ⚠ 検知: {webhook.matched_rules.map((r) => r.name).join(", ")}
            </span>
          )}
        </span>
      </div>
      {replayOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
          <input
            type="url"
            value={replayUrl}
            onChange={(e) => setReplayUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="flex-1 min-w-[200px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm font-mono"
          />
          <button
            type="button"
            onClick={handleReplay}
            disabled={replaying || !replayUrl.trim()}
            className="rounded border border-slate-400 px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {replaying ? "Sending..." : "Send"}
          </button>
          {replayResult && (
            <span className={`text-xs ${replayResult.error ? "text-red-400" : "text-green-400"}`}>
              {replayResult.error ?? `HTTP ${replayResult.status} (${replayResult.elapsed}ms)`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
