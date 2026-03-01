/**
 * US-162/US-168: INBOX ヘッダーのサービス接続状況表示
 * 表形式、URL クリックでコピー、Live=緑/Offline=灰、text-xs
 */
import { useCallback, useEffect, useState } from "react";
import { getHealthServices, type HealthServicesResponse } from "../services/api";

function StatusDot({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
        live ? "bg-green-500" : "bg-slate-400"
      }`}
      title={live ? "Live" : "Offline"}
    />
  );
}

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
      className="text-left truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
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

  const localReceiveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/receive`
      : "—";

  const rows: { label: string; url: string; status: "live" | "offline" }[] = [
    { label: "Public", url: data.public_url.url, status: data.public_url.status },
    { label: "Local", url: localReceiveUrl, status: "live" },
    { label: "Backend", url: data.local_api.url, status: data.local_api.status },
    {
      label: "DB",
      url: data.postgresql.url,
      status: data.postgresql.status,
    },
    { label: "LLM", url: data.ollama.url, status: data.ollama.status },
  ];

  return (
    <div className="text-xs text-slate-600 dark:text-slate-400">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="py-0.5 pr-2 align-middle">{row.label}</td>
              <td className="py-0.5 pr-2 align-middle min-w-0">
                <CopyableUrl url={row.url} onCopy={handleCopy} />
              </td>
              <td className="py-0.5">
                <span className="inline-flex items-center gap-1">
                  <StatusDot live={row.status === "live"} />
                  <span
                  className={
                    row.status === "live"
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-400 dark:text-slate-500"
                  }
                >
                    {row.status}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
