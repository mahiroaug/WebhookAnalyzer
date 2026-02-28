import type { StatsResponse } from "../services/api";

interface StatsCardsProps {
  stats: StatsResponse | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-pulse bg-slate-100 dark:bg-slate-800 h-24" />
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-pulse bg-slate-100 dark:bg-slate-800 h-24" />
      </div>
    );
  }

  const sourceEntries = Object.entries(stats.by_source).sort((a, b) => b[1] - a[1]);
  const eventEntries = Object.entries(stats.by_event_type).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">ソース別件数</h3>
        <div className="flex flex-wrap gap-2">
          {sourceEntries.map(([name, count]) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-sm font-medium text-indigo-800 dark:text-indigo-200"
            >
              {name}: {count}
            </span>
          ))}
          {sourceEntries.length === 0 && (
            <span className="text-slate-500">データなし</span>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">イベントタイプ上位</h3>
        <div className="flex flex-wrap gap-2">
          {eventEntries.map(([name, count]) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-200"
            >
              {name}: {count}
            </span>
          ))}
          {eventEntries.length === 0 && (
            <span className="text-slate-500">データなし</span>
          )}
        </div>
      </div>
    </div>
  );
}
