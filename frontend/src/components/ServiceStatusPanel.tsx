/**
 * US-162/US-168/US-177: INBOX ヘッダーのサービス接続状況表示
 * Part/Component 2列、絵文字ステータス、text-[10px]、余白最小化
 */
import { useCallback, useEffect, useState } from "react";
import { getHealthServices, type HealthServicesResponse } from "../services/api";

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
    status: "live" | "offline";
  }[] = [
    { part: "Public", component: "ngrok", url: data.public_url.url, status: data.public_url.status },
    { part: "Local", component: "Uvicorn", url: localReceiveUrl, status: data.local_api.status },
    { part: "WEB", component: "Vite", url: data.vite.url, status: data.vite.status },
    { part: "DB", component: "PostgreSQL", url: data.postgresql.url, status: data.postgresql.status },
    { part: "LLM", component: "Ollama", url: data.ollama.url, status: data.ollama.status },
  ];

  return (
    <div className="text-[10px] text-slate-600 dark:text-slate-400 min-w-0">
      <table className="w-full border-collapse table-auto">
        <tbody>
          {rows.map((row) => (
            <tr key={row.part}>
              <td className="py-0 pr-1 align-middle whitespace-nowrap">{row.part}</td>
              <td className="py-0 pr-1 align-middle whitespace-nowrap text-slate-500 dark:text-slate-500">{row.component}</td>
              <td className="py-0 pr-1 align-middle whitespace-nowrap" title={row.status === "live" ? "Live" : "Offline"}>
                {row.status === "live" ? "🟢" : "⚫"}
              </td>
              <td className="py-0 align-middle min-w-0 overflow-hidden">
                <CopyableUrl url={row.url} onCopy={handleCopy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
