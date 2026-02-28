/**
 * Payload を表形式で表示するコンポーネント。
 * フィールド辞書・AI分析結果の説明を「説明」列に統合表示する。
 * US-112: Payload 表形式表示とフィールド辞書統合
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PayloadTableProps {
  data: Record<string, unknown>;
  /** フィールド辞書テンプレートの説明（パス -> 説明） */
  templateDescriptions?: Map<string, string>;
  /** AI 分析結果の説明（キー -> 説明） */
  analysisDescriptions?: Record<string, string>;
  /** 辞書テンプレートに含まれるパス集合 */
  knownFieldPaths?: Set<string>;
}

/** クリップボードにコピー */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* フォールバック */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

function getType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "object") return Array.isArray(val) ? `[${val.length} items]` : `{...}`;
  return String(val);
}

interface FieldRowProps {
  path: string;
  keyName: string;
  value: unknown;
  depth: number;
  templateDescriptions?: Map<string, string>;
  analysisDescriptions?: Record<string, string>;
  knownFieldPaths?: Set<string>;
}

function FieldRow({
  path,
  keyName,
  value,
  depth,
  templateDescriptions,
  analysisDescriptions,
  knownFieldPaths,
}: FieldRowProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const type = getType(value);

  const templateDesc = templateDescriptions?.get(path);
  const analysisDesc = analysisDescriptions?.[keyName] || analysisDescriptions?.[path];
  const description = templateDesc || analysisDesc || null;

  const isKnown = !knownFieldPaths || knownFieldPaths.has(path) ||
    [...(knownFieldPaths || [])].some((p) => p.startsWith(path + "."));
  const isUnknown = knownFieldPaths && !isKnown;

  const handleCopy = useCallback(async (text: string, field: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 800);
    }
  }, []);

  const typeColor =
    type === "string" ? "text-[#9FDFBF]" :
    type === "number" ? "text-blue-300" :
    type === "boolean" ? "text-amber-400" :
    type === "null" ? "text-slate-400" :
    "text-slate-300";

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
        <td className="py-1.5 px-2 font-mono text-xs" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <span className="inline-flex items-center gap-1">
            {isExpandable && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-slate-400 hover:text-slate-200 w-4"
              >
                {expanded ? "▼" : "▶"}
              </button>
            )}
            {!isExpandable && <span className="w-4" />}
            <span className={`font-medium ${isUnknown ? "text-violet-400" : "text-[#D4A574]"}`}>
              {keyName}
            </span>
            {isUnknown && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-900/50 text-violet-300">未知</span>
            )}
          </span>
        </td>
        <td className={`py-1.5 px-2 font-mono text-xs ${typeColor} max-w-xs truncate`}>
          {isExpandable ? (
            <span className="text-slate-400">{isArray ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}</span>
          ) : (
            <span
              className="cursor-pointer group-hover:underline"
              title="クリックでコピー"
              onClick={() => handleCopy(typeof value === "string" ? value : String(value), "value")}
            >
              {copiedField === "value" ? "Copied!" : formatValue(value)}
            </span>
          )}
        </td>
        <td className="py-1.5 px-2 text-xs text-slate-400 dark:text-dim-text-muted font-mono">
          {type}
        </td>
        <td className="py-1.5 px-2 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {description || <span className="text-slate-300 dark:text-slate-600">-</span>}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isExpandable && expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td colSpan={4} className="p-0">
              <table className="w-full">
                <tbody>
                  {isObject &&
                    Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                      <FieldRow
                        key={k}
                        path={`${path}.${k}`}
                        keyName={k}
                        value={v}
                        depth={depth + 1}
                        templateDescriptions={templateDescriptions}
                        analysisDescriptions={analysisDescriptions}
                        knownFieldPaths={knownFieldPaths}
                      />
                    ))}
                  {isArray &&
                    (value as unknown[]).map((item, i) => (
                      <FieldRow
                        key={i}
                        path={`${path}[${i}]`}
                        keyName={`[${i}]`}
                        value={item}
                        depth={depth + 1}
                        templateDescriptions={templateDescriptions}
                        analysisDescriptions={analysisDescriptions}
                        knownFieldPaths={knownFieldPaths}
                      />
                    ))}
                </tbody>
              </table>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export function PayloadTable({
  data,
  templateDescriptions,
  analysisDescriptions,
  knownFieldPaths,
}: PayloadTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
            <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted w-1/4">キー</th>
            <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted w-1/3">値</th>
            <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted w-16">型</th>
            <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted">説明</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, val]) => (
            <FieldRow
              key={key}
              path={key}
              keyName={key}
              value={val}
              depth={0}
              templateDescriptions={templateDescriptions}
              analysisDescriptions={analysisDescriptions}
              knownFieldPaths={knownFieldPaths}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
