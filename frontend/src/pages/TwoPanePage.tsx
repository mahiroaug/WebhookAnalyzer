/**
 * US-111: webhook.site 風 2ペインレイアウト
 * US-117: ペインリサイズ対応
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { WebhookListPane } from "../components/WebhookListPane";
import { DetailNavBar, type DetailNavBarData } from "../components/DetailNavBar";
import { WebhookDetailPage } from "./WebhookDetailPage";
import { EventTypeGroupPage } from "./EventTypeGroupPage";
import { SchemaEstimatePage } from "./SchemaEstimatePage";
import { ComparePage } from "./ComparePage";

type RightPane = "detail" | "event-type" | "schema" | "compare";

const STORAGE_KEY = "webhook-pane-width";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

export function TwoPanePage() {
  const { id: idFromParams } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(idFromParams || null);
  const [rightPane, setRightPane] = useState<RightPane>("detail");
  const [navBarData, setNavBarData] = useState<DetailNavBarData | null>(null);
  const [markedReadFromDetail, setMarkedReadFromDetail] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState("");
  const [filterEventType, setFilterEventType] = useState("");
  const [paneWidth, setPaneWidth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(stored, 10))) : DEFAULT_WIDTH;
  });
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /** US-174: Webhook 切替時にナビバーデータをクリア（ロード中は空表示） */
  useEffect(() => {
    setNavBarData(null);
  }, [selectedId]);

  const handleMouseDown = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - rect.left));
      setPaneWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem(STORAGE_KEY, String(paneWidth));
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [paneWidth]);

  /** ブラウザの戻る/進むで URL が変わったときに state を同期 */
  const location = useLocation();
  useEffect(() => {
    const m = location.pathname.match(/^\/webhooks\/([^/]+)/);
    const urlId = m ? m[1] : null;
    setSelectedId((prev) => (prev !== urlId ? urlId : prev));
  }, [location.pathname]);

  const handleNavigate = useCallback(
    (webhookId: string) => {
      setSelectedId(webhookId);
      const search = searchParams.toString();
      navigate({ pathname: `/webhooks/${webhookId}`, search: search ? `?${search}` : "" }, { replace: true });
    },
    [navigate, searchParams]
  );

  const handleSelect = useCallback(
    (webhookId: string) => {
      setRightPane("detail");
      handleNavigate(webhookId);
    },
    [handleNavigate]
  );

  const paneButtons: { key: RightPane; label: string }[] = [
    { key: "detail", label: "詳細" },
    { key: "event-type", label: "event_type別" },
    { key: "schema", label: "スキーマ" },
    { key: "compare", label: "比較" },
  ];

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-3.5rem)]">
      {/* 左ペイン */}
      <div
        style={{ width: paneWidth }}
        className="flex-shrink-0 border-r border-slate-200 dark:border-dim-border flex flex-col bg-white dark:bg-dim-card"
      >
        <WebhookListPane
          selectedId={selectedId}
          onSelect={handleSelect}
          filterSource={filterSource}
          filterEventType={filterEventType}
          onFilterSourceChange={setFilterSource}
          onFilterEventTypeChange={setFilterEventType}
          searchQuery={searchQuery}
          markedReadFromDetail={markedReadFromDetail}
        />
      </div>

      {/* リサイズハンドル */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize bg-transparent hover:bg-blue-400/40 active:bg-blue-400/60 flex-shrink-0 transition-colors"
      />

      {/* 右ペイン */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-dim-border bg-white dark:bg-dim-card">
          {paneButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setRightPane(key);
                if (key === "detail" && selectedId) {
                  navigate(`/webhooks/${selectedId}`);
                }
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                rightPane === key
                  ? "bg-slate-200 text-slate-900 dark:bg-slate-600/60 dark:text-dim-text"
                  : "text-slate-500 dark:text-dim-text-muted hover:bg-slate-100 dark:hover:bg-slate-700/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* US-174: ナビゲーションバーをタブ直下・詳細ペイン上端に固定 */}
        {rightPane === "detail" && selectedId && (
          <DetailNavBar
            data={navBarData}
            searchQuery={searchQuery}
            onNavigate={handleNavigate}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {rightPane === "detail" && selectedId ? (
            <WebhookDetailPage
              webhookId={selectedId}
              onNavigate={handleNavigate}
              onNavBarData={(d) => selectedId && d.webhook.id === selectedId && setNavBarData(d)}
              onMarkedRead={(id) => setMarkedReadFromDetail(id)}
            />
          ) : rightPane === "detail" && !selectedId ? (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-dim-text-muted">
              左のリストから Webhook を選択してください
            </div>
          ) : rightPane === "event-type" ? (
            <EventTypeGroupPage />
          ) : rightPane === "schema" ? (
            <SchemaEstimatePage />
          ) : rightPane === "compare" ? (
            <ComparePage />
          ) : null}
        </div>
      </div>
    </div>
  );
}
