/**
 * US-111: webhook.site 風 2ペインレイアウト
 * 左ペイン（一覧リスト）+ 右ペイン（詳細/比較/スキーマ/event_type別）
 */
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WebhookListPane } from "../components/WebhookListPane";
import { WebhookDetailPage } from "./WebhookDetailPage";
import { EventTypeGroupPage } from "./EventTypeGroupPage";
import { SchemaEstimatePage } from "./SchemaEstimatePage";
import { ComparePage } from "./ComparePage";

type RightPane = "detail" | "event-type" | "schema" | "compare";

export function TwoPanePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rightPane, setRightPane] = useState<RightPane>("detail");
  const [filterSource, setFilterSource] = useState("");
  const [filterEventType, setFilterEventType] = useState("");

  const selectedId = id || null;

  const handleSelect = useCallback(
    (webhookId: string) => {
      setRightPane("detail");
      navigate(`/webhooks/${webhookId}`, { replace: false });
    },
    [navigate]
  );

  const paneButtons: { key: RightPane; label: string }[] = [
    { key: "detail", label: "詳細" },
    { key: "event-type", label: "event_type別" },
    { key: "schema", label: "スキーマ" },
    { key: "compare", label: "比較" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左ペイン */}
      <div className="w-80 min-w-64 max-w-96 border-r border-slate-200 dark:border-dim-border flex flex-col bg-white dark:bg-dim-card">
        <WebhookListPane
          selectedId={selectedId}
          onSelect={handleSelect}
          filterSource={filterSource}
          filterEventType={filterEventType}
          onFilterSourceChange={setFilterSource}
          onFilterEventTypeChange={setFilterEventType}
        />
      </div>

      {/* 右ペイン */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-dim-border bg-white dark:bg-dim-card">
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

        <div className="flex-1 overflow-y-auto p-4">
          {rightPane === "detail" && selectedId ? (
            <WebhookDetailPage />
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
