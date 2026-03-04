/**
 * 折りたたみ可能なアコーディオンセクション。
 * US-118: 詳細画面のアコーディオンセクション
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_PREFIX = "accordion-";

interface AccordionSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function AccordionSection({
  id,
  title,
  defaultOpen = false,
  badge,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (stored !== null) return stored === "1";
    return defaultOpen;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, open ? "1" : "0");
  }, [id, open]);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">{open ? "▼" : "▶"}</span>
          <span className="font-semibold text-sm">{title}</span>
          {badge}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
