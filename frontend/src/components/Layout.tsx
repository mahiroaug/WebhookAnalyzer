/**
 * 共通レイアウト。全画面で一貫したヘッダーとナビゲーションを提供する。
 * US-101: グローバルレイアウトとナビゲーションの統一
 * US-102: DIM カラーテーマ適用
 * US-103: ダークモード手動トグル
 * US-122: グローバルヘッダーに全文検索入力欄
 */
import { useState, useEffect } from "react";
import { Link, Outlet, NavLink, useSearchParams } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "ダッシュボード" },
];

export function Layout() {
  const { isDark, toggle } = useDarkMode();
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
              Webhook Analyzer
            </Link>
            <div className="flex-1 max-w-xs mx-4">
              <input
                type="text"
                placeholder="payload 全文検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchInput);
                }}
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/40 text-slate-500 dark:text-dim-text-muted hover:text-slate-700 dark:hover:text-dim-text transition-colors"
              title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
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
