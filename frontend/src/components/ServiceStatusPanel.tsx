/**
 * US-162/US-168/US-177/US-178: INBOX ヘッダーのサービス接続状況表示
 * Part/Component 2列、絵文字ステータス、レイテンシ、最終確認時刻、エラー表示
 */
import { useCallback, useEffect, useState } from "react";
import {
  getHealthServices,
  type HealthServicesResponse,
  type ServiceStatus,
} from "../services/api";

function CopyableUrl({ url, onCopy }: { url: string; onCopy: (url: string) => void }) {
  const [copied, setCopied] = useState(false);
  const handleClick = useCallback(() => {
    if (!url || url === "—") return;
    onCopy(url);
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [url, onCopy]);

  if (!url || url === "—") return <span className="text-slate-400">—</span>;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full min-w-0 text-left truncate text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
      title="Click to copy"
    >
      {copied ? "✓ Copied" : url}
    </button>
  );
}

function formatAgo(checkedAt: number): string {
  const s = Math.floor(Date.now() / 1000 - checkedAt);
  if (s < 60) return `${s}s前`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m前`;
  const h = Math.floor(m / 60);
  return `${h}h前`;
}

export function ServiceStatusPanel() {
  const [data, setData] = useState<HealthServicesResponse | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getHealthServices();
        setData(res);
      } catch {
        setData(null);
      }
    };
    fetchServices();
    const interval = setInterval(fetchServices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  }, []);

  if (!data) return null;

  const localReceiveUrl = `${data.local_api.url}/api/webhooks/receive`;

  const rows: {
    part: string;
    component: string;
    url: string;
    status: ServiceStatus;
  }[] = [
    { part: "Public", component: "ngrok", url: data.public_url.url, status: data.public_url },
    { part: "Local", component: "Uvicorn", url: localReceiveUrl, status: data.local_api },
    { part: "WEB", component: "Vite", url: data.vite.url, status: data.vite },
    { part: "DB", component: "PostgreSQL", url: data.postgresql.url, status: data.postgresql },
    { part: "LLM", component: "Ollama", url: data.ollama.url, status: data.ollama },
  ];

  const emojiTitle = (status: ServiceStatus): string => {
    if (status.status === "live") {
      const lat = status.latency_ms != null ? ` (${status.latency_ms}ms)` : "";
      return `Live${lat}`;
    }
    return status.error ?? "Offline";
  };

  return (
    <div className="text-[10px] min-w-0 overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-11" />
          <col className="w-13" />
          <col className="w-3" />
          <col className="w-9" />
          <col />
        </colgroup>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.part}
              className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            >
              <td className="py-0.5 pl-2 pr-0.5 font-mono text-[#D4A574] whitespace-nowrap">
                {row.part}
              </td>
              <td className="py-0.5 pr-0.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {row.component}
              </td>
              <td className="py-0.5 pr-0.5 whitespace-nowrap" title={emojiTitle(row.status)}>
                {row.status.status === "live" ? "🟢" : "⚫"}
              </td>
              <td className="py-0.5 pr-0.5 text-slate-500 dark:text-dim-text-muted whitespace-nowrap text-right">
                {row.status.latency_ms != null && row.status.status === "live"
                  ? `${row.status.latency_ms}ms`
                  : "—"}
              </td>
              <td className="py-0.5 pr-1.5 pl-0 min-w-0 overflow-hidden">
                <CopyableUrl url={row.url} onCopy={handleCopy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.checked_at != null && (
        <div className="pl-2 pr-1.5 py-0.5 text-slate-500 dark:text-dim-text-muted border-t border-slate-100 dark:border-slate-700/30">
          Last checked: {formatAgo(data.checked_at)}
        </div>
      )}
    </div>
  );
}
