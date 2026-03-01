import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getWebhook,
  getAnalysis,
  getFieldTemplate,
  getAdjacentWebhooks,
  triggerAnalyzeStream,
  getDefinitionStatus,
  getDefinitionContent,
  updateFieldDescription,
  mergeDefinition,
  type WebhookDetail,
  type WebhookAnalysisResponse,
  type FieldTemplateResponse,
} from "../services/api";
import { PayloadTable } from "../components/PayloadTable";
import { AccordionSection } from "../components/AccordionSection";
import {
  DefinitionDiffModal,
  computeDiff,
  type DefinitionDiff,
  type PartialApplyPayload,
} from "../components/DefinitionDiffModal";
import { formatReceivedAt } from "../utils/formatDate";
import type { DetailNavBarData } from "../components/DetailNavBar";

/** US-120: Webhook 遷移時も開閉状態を維持するリクエストヘッダー details */
const REQUEST_HEADERS_STORAGE_KEY = "webhook-detail-request-headers-open";

/** US-152: 構造化ログエントリ（時刻・プロンプト・回答） */
interface AnalysisLogEntry {
  message: string;
  timestamp?: string;
  prompt_full?: string;
  response_full?: string;
}

/** US-134/152: 分析ログビューア（時刻・折りたたみプロンプト/回答・自動スクロール） */
function AnalysisLogViewer({ logs, totalElapsedMs }: { logs: AnalysisLogEntry[]; totalElapsedMs?: number | null }) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  useEffect(() => {
    if (logs.length > 0 && !open) setOpen(true);
  }, [logs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || logs.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!userScrolledUp) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs.length, open, userScrolledUp]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setUserScrolledUp((u) => (nearBottom ? false : u || true));
  };

  const fmtTime = (ts: string | undefined) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("ja-JP", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
      >
        {open ? "▼" : "▶"} 分析ログ ({logs.length})
        {totalElapsedMs != null && (
          <span className="text-slate-500 dark:text-dim-text-muted">・{Math.round(totalElapsedMs / 1000)}s</span>
        )}
      </button>
      {open && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mt-1 p-2 rounded border border-slate-600 dark:border-slate-600 bg-slate-900/50 text-xs font-mono text-slate-400 max-h-[960px] overflow-y-auto"
        >
          {logs.map((entry, i) => (
            <div key={i} className="mb-2">
              {entry.timestamp && (
                <span className="text-slate-500 mr-2">{fmtTime(entry.timestamp)}</span>
              )}
              <span>{entry.message}</span>
              {entry.prompt_full && (
                <CollapsibleBlock label="プロンプト全文" content={entry.prompt_full} />
              )}
              {entry.response_full && (
                <CollapsibleBlock label="AI回答全文" content={entry.response_full} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleBlock({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-1 ml-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-slate-500 hover:text-slate-400 text-[10px]"
      >
        {open ? "▼" : "▶"} {label}
      </button>
      {open && (
        <pre className="mt-0.5 p-2 rounded bg-slate-950/80 text-[10px] overflow-x-auto whitespace-pre-wrap break-words max-h-[512px] overflow-y-auto">
          {content}
        </pre>
      )}
    </div>
  );
}

function RequestHeadersDetails({ headers, count }: { headers: Record<string, string>; count: number }) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(REQUEST_HEADERS_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(REQUEST_HEADERS_STORAGE_KEY, open ? "1" : "0");
    } catch { /* ignore */ }
  }, [open]);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-1"
      >
        {open ? "▼" : "▶"} リクエストヘッダー ({count})
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs font-mono">
          {Object.entries(headers).map(([k, v]) => (
            <span key={k} className="contents">
              <dt className="text-slate-400">{k}</dt>
              <dd className="truncate text-slate-300">{v}</dd>
            </span>
          ))}
        </dl>
      )}
    </div>
  );
}
/** US-132: 初回アクセス時のスケルトン（テキスト「読み込み中...」の代わり） */
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-7 w-16 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50" />
        <div className="h-7 w-16 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50" />
        <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-600/50" />
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-4">
        <div className="h-4 w-24 mb-3 rounded bg-slate-200 dark:bg-slate-600/50" />
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="contents">
              <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-600/50" />
              <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-700/50" />
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-4">
        <div className="h-4 w-16 mb-3 rounded bg-slate-200 dark:bg-slate-600/50" />
        <div className="space-y-2">
          <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-700/50" />
          <div className="h-8 w-[80%] rounded bg-slate-100 dark:bg-slate-700/50" />
          <div className="h-8 w-[60%] rounded bg-slate-100 dark:bg-slate-700/50" />
        </div>
      </div>
    </div>
  );
}

interface WebhookDetailPageProps {
  onNavBarData?: (data: DetailNavBarData) => void;
}

export function WebhookDetailPage({ onNavBarData }: WebhookDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null);
  const [analysis, setAnalysis] = useState<WebhookAnalysisResponse | null>(null);
  const [fieldTemplate, setFieldTemplate] = useState<FieldTemplateResponse | null>(null);
  const [adjacent, setAdjacent] = useState<{ prev_id: string | null; next_id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  /** US-134/135/152: ストリーミング分析ログ（構造化） */
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLogEntry[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<{
    evidence: boolean;
    explanation: boolean;
    fields: boolean;
    saved: boolean;
  }>({ evidence: false, explanation: false, fields: false, saved: false });
  const [streamElapsedMs, setStreamElapsedMs] = useState<number | null>(null);
  /** US-148: リアルタイムカウント用の開始時刻 */
  const analysisStartTimeRef = useRef<number | null>(null);

  /** US-148: 分析中は 1 秒ごとに経過時間を更新 */
  useEffect(() => {
    if (!analyzing) return;
    analysisStartTimeRef.current = Date.now();
    const iv = setInterval(() => {
      if (analysisStartTimeRef.current != null) {
        setStreamElapsedMs(Date.now() - analysisStartTimeRef.current);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [analyzing]);

  /** US-134/148/153: ページ表示時に sessionStorage から前回ログ・所要時間を復元（Webhook ID ごとに保存） */
  useEffect(() => {
    if (!id || analyzing) return;
    try {
      const storageKey = `webhook-analysis-logs-${id}`;
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : parsed?.logs ?? [];
      const storedLogs: AnalysisLogEntry[] = arr.map((e: unknown) =>
        typeof e === "string" ? { message: e } : (e as AnalysisLogEntry)
      );
      const storedElapsed = !Array.isArray(parsed) && typeof parsed?.elapsedMs === "number" ? parsed.elapsedMs : undefined;
      if (storedLogs.length) {
        setAnalysisLogs(storedLogs);
        if (storedElapsed != null) setStreamElapsedMs(storedElapsed);
      }
    } catch { /* ignore */ }
  }, [id, analyzing]);

  /** US-153: Webhook 切替時に分析ログをリセット */
  useEffect(() => {
    if (id) {
      setAnalysisLogs([]);
      setStreamElapsedMs(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const webhookId = id;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [detailRes, analysisRes, adjacentRes] = await Promise.all([
          getWebhook(webhookId),
          getAnalysis(webhookId),
          getAdjacentWebhooks(webhookId),
        ]);
        if (!cancelled) {
          setWebhook(detailRes);
          setAnalysis(analysisRes ?? null);
          setAdjacent(adjacentRes);
          const templateRes = await getFieldTemplate(
            detailRes.source,
            detailRes.event_type
          );
          if (!cancelled) setFieldTemplate(templateRes ?? null);
        }
      } catch {
        if (!cancelled) {
          setWebhook(null);
          setAdjacent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  /** US-141: 定義ファイルが存在し編集可能な場合に getDefinitionStatus で確認 */
  useEffect(() => {
    if (!webhook) {
      setDefinitionWritable(false);
      return;
    }
    let cancelled = false;
    getDefinitionStatus(webhook.source, webhook.event_type)
      .then((s) => { if (!cancelled) setDefinitionWritable(s.exists && s.writable); })
      .catch(() => { if (!cancelled) setDefinitionWritable(false); });
    return () => { cancelled = true; };
  }, [webhook?.id, webhook?.source, webhook?.event_type]);

  const goPrev = useCallback(() => {
    if (adjacent?.prev_id) {
      const search = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      navigate(`/webhooks/${adjacent.prev_id}${search}`);
    }
  }, [adjacent?.prev_id, navigate, searchQuery]);
  const goNext = useCallback(() => {
    if (adjacent?.next_id) {
      const search = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      navigate(`/webhooks/${adjacent.next_id}${search}`);
    }
  }, [adjacent?.next_id, navigate, searchQuery]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  /** US-143: LLM provider/model オーバーライド・比較モード */
  const [llmOptionsOpen, setLlmOptionsOpen] = useState(false);
  const [llmProvider, setLlmProvider] = useState("ollama");
  const [llmModel, setLlmModel] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<Array<{ provider: string; model: string; result: WebhookAnalysisResponse }>>([]);

  /** US-141: 定義ファイル編集可否 */
  const [definitionWritable, setDefinitionWritable] = useState(false);

  /** US-142: 定義 diff モーダル */
  const [diffModal, setDiffModal] = useState<{
    diff: DefinitionDiff;
    newResult: WebhookAnalysisResponse;
  } | null>(null);

  /** US-144: マスキング ON/OFF（localStorage で永続化、デフォルト ON） */
  const [payloadViewMode, setPayloadViewMode] = useState<"table" | "json">("table");
  const [jsonCopyFeedback, setJsonCopyFeedback] = useState(false);
  const [maskEnabled, setMaskEnabled] = useState(() => {
    try {
      return localStorage.getItem("webhook-mask-enabled") !== "0";
    } catch { return true; }
  });
  useEffect(() => {
    try {
      localStorage.setItem("webhook-mask-enabled", maskEnabled ? "1" : "0");
    } catch { /* ignore */ }
  }, [maskEnabled]);

  /** US-141: 定義ファイルの description を保存して再取得 */
  const handleDescriptionSave = useCallback(async (path: string, description: string) => {
    if (!webhook) return;
    await updateFieldDescription(webhook.source, webhook.event_type, path, description);
    const [analysisRes, templateRes] = await Promise.all([
      getAnalysis(webhook.id),
      getFieldTemplate(webhook.source, webhook.event_type),
    ]);
    setAnalysis(analysisRes ?? null);
    setFieldTemplate(templateRes ?? null);
  }, [webhook]);

  /** US-174: 親にナビゲーションデータを渡す（タブ直下の DetailNavBar 用） */
  useEffect(() => {
    if (webhook && adjacent && onNavBarData) {
      onNavBarData({ webhook, adjacent });
    }
  }, [webhook, adjacent, onNavBarData]);

  async function handleAnalyze() {
    if (!id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisLogs([]);
    setAnalysisProgress({ evidence: false, explanation: false, fields: false, saved: false });
    setStreamElapsedMs(null);
    const logs: AnalysisLogEntry[] = [];
    let lastElapsedMs: number | null = null;
    try {
      const res = await triggerAnalyzeStream(
        id,
        feedbackText || undefined,
        (ev) => {
          const step = ev.step as "evidence" | "explanation" | "fields" | "saved";
          if (ev.message) {
            const entry: AnalysisLogEntry = {
              message: ev.message,
              timestamp: ev.timestamp,
              prompt_full: ev.prompt_full,
              response_full: ev.response_full,
            };
            logs.push(entry);
            setAnalysisLogs((prev) => [...prev, entry]);
          }
          if (ev.total_elapsed_ms != null) {
            lastElapsedMs = ev.total_elapsed_ms;
            setStreamElapsedMs(ev.total_elapsed_ms);
          }
          setAnalysisProgress((p) => {
            if (step && step in p) return { ...p, [step]: true };
            return p;
          });
          if (ev.step === "saved" && ev.analysis) setAnalysis(ev.analysis as WebhookAnalysisResponse);
        },
        { provider: llmProvider, model: llmModel || undefined }
      );
      if (res) {
        if (compareMode) {
          setCompareResults((prev) => [
            ...prev,
            { provider: llmProvider, model: llmModel || "(default)", result: res },
          ]);
        }
        setAnalysis(res);
        // US-142: 定義ファイルが存在し差分があれば diff モーダルを表示
        if (webhook && !res.summary?.startsWith("[分析失敗]")) {
          try {
            const existing = await getDefinitionContent(webhook.source, webhook.event_type);
            const diff = computeDiff(
              existing,
              { summary: res.summary, field_descriptions: res.field_descriptions || {} }
            );
            const hasChanges =
              diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0 || diff.summaryChanged;
            if (hasChanges) {
              setDiffModal({ diff, newResult: res });
            }
          } catch {
            // 定義ファイルなし（404）の場合はスキップ
          }
        }
      }
      // US-134/148/153: 完了時にログを sessionStorage に保存（Webhook ID ごと）
      if (id) {
        try {
          sessionStorage.setItem(
            `webhook-analysis-logs-${id}`,
            JSON.stringify({ logs, elapsedMs: lastElapsedMs ?? undefined })
          );
        } catch { /* ignore */ }
      }
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setAnalyzing(false);
    }
  }

  /** US-142: マージ完了時のリフレッシュ */
  const refetchAfterMerge = useCallback(async () => {
    if (!id || !webhook) return;
    const [analysisRes, templateRes] = await Promise.all([
      getAnalysis(webhook.id),
      getFieldTemplate(webhook.source, webhook.event_type),
    ]);
    setAnalysis(analysisRes ?? null);
    setFieldTemplate(templateRes ?? null);
  }, [id, webhook]);

  const handleDiffMerge = useCallback(async () => {
    if (!webhook || !diffModal) return;
    await mergeDefinition(webhook.source, webhook.event_type, {
      summary: diffModal.newResult.summary ?? undefined,
      field_descriptions: diffModal.newResult.field_descriptions || {},
      removed_paths: diffModal.diff.removed.map((r) => r.path),
    });
    setDiffModal(null);
    await refetchAfterMerge();
  }, [webhook, diffModal, refetchAfterMerge]);

  const handleDiffPartial = useCallback(
    async (payload: PartialApplyPayload) => {
      if (!webhook || !diffModal) return;
      await mergeDefinition(webhook.source, webhook.event_type, payload);
      setDiffModal(null);
      await refetchAfterMerge();
    },
    [webhook, diffModal, refetchAfterMerge]
  );

  const analysisFailed =
    analysis?.summary?.startsWith("[分析失敗]") ?? false;

  // US-132: 初回アクセス時はスケルトン、遷移時は前コンテンツを表示し続ける
  if (!loading && !webhook) {
    return (
      <div className="text-slate-500 dark:text-dim-text-muted">
        Webhook が見つかりません
      </div>
    );
  }

  if (loading && !webhook) {
    return <DetailSkeleton />;
  }

  // この分岐では webhook は必ず存在（早期 return 済み）
  if (!webhook) return null;

  return (
    <div className="relative">
      {/* US-142: 定義 diff モーダル */}
      {diffModal && webhook && (
        <DefinitionDiffModal
          diff={diffModal.diff}
          newResult={{
            summary: diffModal.newResult.summary,
            field_descriptions: diffModal.newResult.field_descriptions || {},
          }}
          onMerge={handleDiffMerge}
          onSkip={() => setDiffModal(null)}
          onPartialApply={handleDiffPartial}
        />
      )}
      {/* US-132: ローディング中は前コンテンツを表示しつつ、控えめなプログレスバーを表示 */}
      {loading && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full w-1/3 bg-blue-400 dark:bg-blue-500 us132-progress"
            role="progressbar"
            aria-busy="true"
          />
        </div>
      )}
      {/* US-174: ナビバーはタブ直下の DetailNavBar に移動済み */}
      <AccordionSection id="meta" title="リクエスト情報" defaultOpen={false}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">source</dt>
          <dd className="font-mono">{webhook.source}</dd>
          <dt className="text-slate-500 dark:text-slate-400">event_type</dt>
          <dd className="font-mono">{webhook.event_type}</dd>
          <dt className="text-slate-500 dark:text-slate-400">group_key</dt>
          <dd className="font-mono">{webhook.group_key}</dd>
          <dt className="text-slate-500 dark:text-slate-400">received_at</dt>
          <dd className="font-mono">{formatReceivedAt(webhook.received_at)}</dd>
          {webhook.http_method && <>
            <dt className="text-slate-500 dark:text-slate-400">HTTP メソッド</dt>
            <dd className="font-mono">{webhook.http_method}</dd>
          </>}
          {webhook.remote_ip && <>
            <dt className="text-slate-500 dark:text-slate-400">送信元 IP</dt>
            <dd className="font-mono">{webhook.remote_ip}</dd>
          </>}
        </dl>
        {webhook.request_headers && Object.keys(webhook.request_headers).length > 0 && (
          <RequestHeadersDetails
            headers={webhook.request_headers}
            count={Object.keys(webhook.request_headers).length}
          />
        )}
      </AccordionSection>

      <AccordionSection id="payload" title="Payload" defaultOpen={true}>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex gap-0.5 rounded border border-slate-600 p-0.5">
              <button
                type="button"
                onClick={() => setPayloadViewMode("table")}
                className={`px-2 py-0.5 text-xs rounded ${payloadViewMode === "table" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setPayloadViewMode("json")}
                className={`px-2 py-0.5 text-xs rounded ${payloadViewMode === "json" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                JSON
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={maskEnabled}
                onChange={(e) => setMaskEnabled(e.target.checked)}
                className="rounded border-slate-500"
              />
              <span>Mask Sensitive Data</span>
            </label>
          </div>
          {payloadViewMode === "json" && (
            <button
              type="button"
              onClick={async () => {
                const text = JSON.stringify(webhook.payload ?? {}, null, 2);
                try {
                  await navigator.clipboard?.writeText(text);
                  setJsonCopyFeedback(true);
                  setTimeout(() => setJsonCopyFeedback(false), 1000);
                } catch {
                  try {
                    document.execCommand("copy", false, text);
                    setJsonCopyFeedback(true);
                    setTimeout(() => setJsonCopyFeedback(false), 1000);
                  } catch { /* ignore */ }
                }
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {jsonCopyFeedback ? "✓ Copied" : "Copy"}
            </button>
          )}
        </div>
        {payloadViewMode === "table" && <PayloadTable
          data={webhook.payload}
          maskEnabled={maskEnabled}
          templateDescriptions={
            fieldTemplate?.fields?.length
              ? new Map(fieldTemplate.fields.map((f) => [f.path, f.description]))
              : undefined
          }
          analysisDescriptions={analysis?.field_descriptions}
          knownFieldPaths={(() => {
            const templatePaths = fieldTemplate?.fields?.length ? fieldTemplate.fields.map((f) => f.path) : [];
            const analysisKeys = analysis?.field_descriptions ? Object.keys(analysis.field_descriptions) : [];
            return (templatePaths.length > 0 || analysisKeys.length > 0)
              ? new Set([...templatePaths, ...analysisKeys])
              : undefined;
          })()}
          definitionEditable={
            definitionWritable ? { source: webhook.source, eventType: webhook.event_type } : undefined
          }
          onDescriptionSave={definitionWritable ? handleDescriptionSave : undefined}
        />}
        {payloadViewMode === "json" && (
          <pre className="rounded-lg border border-slate-600 bg-slate-900/50 p-4 text-xs font-mono text-slate-300 overflow-x-auto overflow-y-auto max-h-[480px] whitespace-pre-wrap break-words">
            {JSON.stringify(webhook.payload ?? {}, null, 2)}
          </pre>
        )}
      </AccordionSection>

      {analysis && (
        <AccordionSection
          id="analysis"
          title="AI 分析結果"
          defaultOpen={false}
          badge={
            analysisFailed
              ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300">失敗</span>
              : analysis.from_definition_file
                ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/50 text-slate-300">定義ファイルから読み込み</span>
                : undefined
          }
        >
          {/* US-127: 3 層表示（概要・個別解説・Key 説明） */}
          {analysis.summary && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-slate-500 dark:text-dim-text-muted mb-1">概要</h4>
              <p className={`text-sm whitespace-pre-wrap ${analysisFailed ? "text-red-400" : "text-slate-300"}`}>{analysis.summary}</p>
            </div>
          )}
          {analysis.explanation && !analysis.from_definition_file && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-slate-500 dark:text-dim-text-muted mb-1">個別解説</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{analysis.explanation}</p>
            </div>
          )}
          {analysis.field_descriptions && Object.keys(analysis.field_descriptions).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-dim-text-muted mb-2">Key 説明</h4>
              <dl className="space-y-2">
                {Object.entries(analysis.field_descriptions).map(([key, desc]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="font-mono text-xs text-[#D4A574] shrink-0">{key}:</dt>
                    <dd className="text-xs text-slate-400 flex-1">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {/* US-120: 再分析ボタンは 1 箇所のみ（下の AnalyzeButton に集約） */}
        </AccordionSection>
      )}

      {/* US-150: スキーマドリフトは AI 分析結果の下に配置 */}
      {webhook.schema_drift?.has_drift && (
        <AccordionSection
          id="drift"
          title="スキーマドリフト"
          defaultOpen={false}
          badge={webhook.schema_drift.risk_level === "high"
            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300">高リスク</span>
            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300">検知</span>
          }
        >
          <div className="space-y-2 text-sm">
            {webhook.schema_drift.added && webhook.schema_drift.added.length > 0 && (
              <div><span className="font-medium text-green-400">追加:</span> <span className="font-mono">{webhook.schema_drift.added.join(", ")}</span></div>
            )}
            {webhook.schema_drift.removed && webhook.schema_drift.removed.length > 0 && (
              <div><span className="font-medium text-red-400">削除:</span> <span className="font-mono">{webhook.schema_drift.removed.join(", ")}</span></div>
            )}
            {webhook.schema_drift.type_changed && webhook.schema_drift.type_changed.length > 0 && (
              <div>
                <span className="font-medium text-amber-400">型変更:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {webhook.schema_drift.type_changed.map((tc, i) => (
                    <li key={i} className="font-mono text-xs">{tc.path}: {tc.expected_type} → {tc.actual_type}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* US-143: 比較モード結果を並べて表示 */}
      {compareResults.length > 0 && (
        <AccordionSection id="compare" title="LLM 比較結果" defaultOpen={true}>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setCompareResults([])}
              className="text-xs px-2 py-1 rounded border border-slate-500 text-slate-400 hover:bg-slate-700"
            >
              クリア
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compareResults.map((cr, i) => (
              <div
                key={i}
                className="rounded border border-slate-600 bg-slate-800/50 p-3 text-sm"
              >
                <div className="text-xs font-medium text-slate-400 mb-2">
                  {cr.provider} / {cr.model}
                </div>
                {cr.result.summary && (
                  <p className="text-slate-300 text-xs mb-2 line-clamp-3">{cr.result.summary}</p>
                )}
                {cr.result.field_descriptions && Object.keys(cr.result.field_descriptions).length > 0 && (
                  <dl className="space-y-1 text-xs">
                    {Object.entries(cr.result.field_descriptions).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex gap-1">
                        <dt className="font-mono text-[#D4A574] shrink-0">{k}:</dt>
                        <dd className="text-slate-400 truncate">{v}</dd>
                      </div>
                    ))}
                    {Object.keys(cr.result.field_descriptions).length > 3 && (
                      <span className="text-slate-500">…他 {Object.keys(cr.result.field_descriptions).length - 3} 件</span>
                    )}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {analyzeError && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3">
          <p className="text-red-300 text-sm font-medium">分析の実行に失敗しました</p>
          <p className="text-xs text-red-400 mt-1">{analyzeError}</p>
        </div>
      )}

      {/* US-120: ゴーストスタイル、再分析は 1 箇所のみ。US-128: フィードバック入力欄。US-133: 分析中スピナー。US-134/135: プログレスバー・ログ */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded border border-slate-400 dark:border-slate-500 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {analyzing && (
              <span className="inline-block w-4 h-4 border-2 border-slate-400 dark:border-slate-400 border-t-transparent rounded-full us133-spinner" aria-hidden />
            )}
            {analyzing ? "Analyzing..." : analyzeError ? "Retry" : analysis ? "Re-analyze" : "Analyze"}
          </button>
          {streamElapsedMs != null && analyzing && (
            <span className="text-xs text-slate-500 dark:text-dim-text-muted">
              {Math.round(streamElapsedMs / 1000)}s
            </span>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen((o) => !o)}
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            {feedbackOpen ? "▼ フィードバックを閉じる" : "▶ 改善指示を添える"}
          </button>
          <button
            type="button"
            onClick={() => setLlmOptionsOpen((o) => !o)}
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            {llmOptionsOpen ? "▼ LLM 設定を閉じる" : "▶ LLM 設定"}
          </button>
        </div>
        {llmOptionsOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">provider:</span>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="rounded border border-slate-500 bg-slate-800 px-1.5 py-0.5"
              >
                <option value="ollama">Ollama</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">model:</span>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="デフォルト (gemma3:4b)"
                className="w-40 rounded border border-slate-500 bg-slate-800 px-1.5 py-0.5 font-mono placeholder:text-slate-600"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="rounded border-slate-500"
              />
              <span className="text-slate-500">比較モード</span>
            </label>
          </div>
        )}
        {/* US-135: 4ステップのプログレスバー */}
        {analyzing && (
          <div className="mt-2 flex items-center gap-1">
            {[
              { key: "evidence", label: "エビデンス" },
              { key: "explanation", label: "解説" },
              { key: "fields", label: "フィールド" },
              { key: "saved", label: "Saved" },
            ].map(({ key, label }, i) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    analysisProgress[key as keyof typeof analysisProgress]
                      ? "bg-green-500"
                      : "bg-slate-500 dark:bg-slate-600"
                  }`}
                  title={label}
                />
                <span className="text-[10px] text-slate-500 dark:text-dim-text-muted">{label}</span>
                {i < 3 && <span className="text-slate-600 dark:text-slate-500">→</span>}
              </span>
            ))}
          </div>
        )}
        {feedbackOpen && (
          <div className="mt-2">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="例: ハッシュ値を含めないこと"
              rows={2}
              className="w-full rounded border border-slate-500 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>
        )}
        {/* US-134: 分析ログビューア（展開可能・自動展開・総所要時間表示） */}
        {analysisLogs.length > 0 && (
          <AnalysisLogViewer logs={analysisLogs} totalElapsedMs={streamElapsedMs} />
        )}
      </div>
    </div>
  );
}
