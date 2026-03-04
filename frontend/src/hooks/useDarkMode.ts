/**
 * ダーク/ライトモードのトグル。localStorage で永続化、OS 設定に従った初回表示。
 * US-103: ダークモード手動トグル
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "webhook-analyzer-theme";

type Theme = "dark" | "light";

function getSystemPreference(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    return getSystemPreference();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // 初回マウント時、localStorage に無ければ OS 設定を反映
  useEffect(() => {
    if (getStoredTheme()) return;
    setThemeState(getSystemPreference());
  }, []);

  const toggle = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, isDark: theme === "dark", toggle };
}
