/**
 * US-162: INBOX ヘッダーのサービス接続状況表示
 * 公開 URL / ローカル API / PostgreSQL / Ollama を縦並びで表示、30 秒ポーリング
 */
import { useEffect, useState } from "react";
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

  if (!data) return null;

  return (
    <div className="flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400">
      <div className="flex items-center gap-1.5 min-w-0">
        <StatusDot live={data.public_url.status === "live"} />
        <span className="truncate" title={data.public_url.url}>
          Public: {data.public_url.url === "—" ? "—" : data.public_url.url}
        </span>
        <span className="shrink-0">{data.public_url.status}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot live={data.local_api.status === "live"} />
        <span>API localhost:8000</span>
        <span className="shrink-0">{data.local_api.status}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot live={data.postgresql.status === "live"} />
        <span>PostgreSQL</span>
        <span className="shrink-0">{data.postgresql.status}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot live={data.ollama.status === "live"} />
        <span>Ollama</span>
        <span className="shrink-0">{data.ollama.status}</span>
      </div>
    </div>
  );
}
