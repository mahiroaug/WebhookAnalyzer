/**
 * 共通レイアウト。全画面で一貫したヘッダーとナビゲーションを提供する。
 * US-101: グローバルレイアウトとナビゲーションの統一
 * US-102: DIM カラーテーマ適用
 * US-103: ダークモード手動トグル
 * US-122: グローバルヘッダーに全文検索入力欄
 * US-187: LLM 有効/無効のグローバルスライドスイッチ
 */
import { useState, useEffect } from "react";
import { Link, Outlet, NavLink, useSearchParams } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";
import { useLlmEnabled } from "../contexts/LlmEnabledContext";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/settings/alert-rules", label: "Alert Rules" },
];

export function Layout() {
  const { isDark, toggle } = useDarkMode();
  const { enabled: llmEnabled, setEnabled: setLlmEnabled } = useLlmEnabled();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(qFromUrl);
  useEffect(() => setSearchInput(qFromUrl), [qFromUrl]);

  const handleSearch = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (q.trim()) {
      next.set("q", q.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-dim-bg dark:text-dim-text overflow-hidden">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-dim-border dark:bg-dim-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <Link
              to="/"
              className="text-lg font-semibold text-slate-900 dark:text-dim-text shrink-0 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Webhook AI Analyzer
            </Link>
            <div className="flex-1 max-w-xs mx-4 relative">
              <input
                type="text"
                placeholder="全文検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchInput);
                }}
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-1.5 pr-7 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); handleSearch(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm leading-none"
                  title="Clear"
                >
                  x
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-dim-text-muted">LLM</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={llmEnabled}
                  onClick={() => setLlmEnabled(!llmEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                    llmEnabled
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  title={llmEnabled ? "LLM ON" : "LLM OFF"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      llmEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-medium w-6 ${
                    llmEnabled
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {llmEnabled ? "ON" : "OFF"}
                </span>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/40 text-slate-500 dark:text-dim-text-muted hover:text-slate-700 dark:hover:text-dim-text transition-colors"
                title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
              >
                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <nav className="flex items-center gap-1">
                {navItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-200 text-slate-900 dark:bg-slate-600/60 dark:text-dim-text"
                          : "text-slate-600 dark:text-dim-text-muted hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700/40 dark:hover:text-dim-text"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
