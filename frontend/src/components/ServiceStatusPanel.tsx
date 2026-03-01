/**
 * US-162/US-168/US-177/US-178: INBOX ヘッダーのサービス接続状況表示
 * Part/Component 2列、絵文字ステータス、レイテンシ、最終確認時刻、エラー表示
 */
import { useCallback, useEffect, useState } from "react";
import { getHealthServices, type HealthServicesResponse, type ServiceStatus } from "../services/api";

function CopyableUrl({
  url,
  onCopy,
}: {
  url: string;
  onCopy: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleClick = useCallback(() => {
    if (!url || url === "—") return;
    onCopy(url);
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [url, onCopy]);

  if (!url || url === "—")
    return <span className="text-slate-400">—</span>;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full min-w-0 text-left truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
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
    const interval = setInterval(fetchServices, 30_000);
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
    <div className="text-[10px] text-slate-600 dark:text-slate-400 min-w-0">
      <table className="w-full border-collapse table-auto">
        <tbody>
          {rows.map((row) => (
            <tr key={row.part}>
              <td className="py-0 pr-1 align-middle whitespace-nowrap">{row.part}</td>
              <td className="py-0 pr-1 align-middle whitespace-nowrap text-slate-500 dark:text-slate-500">{row.component}</td>
              <td className="py-0 pr-1 align-middle whitespace-nowrap" title={emojiTitle(row.status)}>
                {row.status.status === "live" ? "🟢" : "⚫"}
              </td>
              <td className="py-0 pr-1 align-middle whitespace-nowrap">
                {row.status.latency_ms != null && row.status.status === "live" ? (
                  <span className="text-slate-500">{row.status.latency_ms}ms</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-0 align-middle min-w-0 overflow-hidden">
                <CopyableUrl url={row.url} onCopy={handleCopy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.checked_at != null && (
        <div className="mt-0.5 text-slate-500 dark:text-slate-500">
          最終確認: {formatAgo(data.checked_at)}
        </div>
      )}
    </div>
  );
}
