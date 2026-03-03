/**
 * US-187: LLM 有効/無効のグローバル状態。localStorage で永続化。
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "webhook-analyzer-llm-enabled";

type LlmEnabledContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const LlmEnabledContext = createContext<LlmEnabledContextValue | null>(null);

function getStored(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== "false";
}

export function LlmEnabledProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(getStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
  }, []);

  return (
    <LlmEnabledContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </LlmEnabledContext.Provider>
  );
}

export function useLlmEnabled(): LlmEnabledContextValue {
  const ctx = useContext(LlmEnabledContext);
  if (!ctx) {
    // Layout 外で使われる場合のフォールバック（通常は発生しない）
    return {
      enabled: true,
      setEnabled: () => {},
    };
  }
  return ctx;
}
