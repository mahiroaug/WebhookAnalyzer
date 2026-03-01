/**
 * Payload を表形式で表示するコンポーネント。
 * フィールド辞書・AI分析結果の説明を「description」列に統合表示する。
 * US-112: Payload 表形式表示とフィールド辞書統合
 * US-130: カラムヘッダー英語化、値の全文表示（truncate 廃止）
 * US-147: 全展開・全折りたたみボタン
 */
import { useState, useCallback, useContext, useEffect, createContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** US-147: 全展開/全折りたたみのトリガーを配信 */
const ExpandTriggerContext = createContext<{ expandAll: number; collapseAll: number }>({ expandAll: 0, collapseAll: 0 });

/** US-141: 定義ファイル編集可能時 */
export interface DefinitionEditable {
  source: string;
  eventType: string;
}

interface PayloadTableProps {
  data: Record<string, unknown>;
  /** フィールド辞書テンプレートの説明（パス -> 説明） */
  templateDescriptions?: Map<string, string>;
  /** AI 分析結果の説明（キー -> 説明） */
  analysisDescriptions?: Record<string, string>;
  /** 辞書テンプレートに含まれるパス集合 */
  knownFieldPaths?: Set<string>;
  /** US-144: マスキング有効時、該当フィールドの値を *** で表示 */
  maskEnabled?: boolean;
  /** US-141: 定義ファイル編集可能時（source, eventType） */
  definitionEditable?: DefinitionEditable;
  /** US-141: 説明保存コールバック */
  onDescriptionSave?: (path: string, description: string) => Promise<void>;
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

/** US-120: 文字列はダブルクォーテーションなし（型列の "string" で判別可能） */
function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return val;
  if (typeof val === "object") return Array.isArray(val) ? `[${val.length} items]` : `{...}`;
  return String(val);
}

/** US-144: マスキング対象のキーパターン（小文字で部分一致） */
const DEFAULT_MASK_PATTERNS = [
  "private_key", "api_key", "apikey", "secret", "token", "password", "authorization",
  "address", "wallet", "signature", "encrypted", "credential",
];

function shouldMask(path: string, keyName: string, maskEnabled: boolean): boolean {
  if (!maskEnabled) return false;
  const fullPath = path === keyName ? path : `${path}.${keyName}`;
  const lower = fullPath.toLowerCase();
  return DEFAULT_MASK_PATTERNS.some((p) => lower.includes(p));
}

interface FieldRowProps {
  path: string;
  keyName: string;
  value: unknown;
  depth: number;
  templateDescriptions?: Map<string, string>;
  analysisDescriptions?: Record<string, string>;
  knownFieldPaths?: Set<string>;
  maskEnabled?: boolean;
  definitionEditable?: DefinitionEditable;
  onDescriptionSave?: (path: string, description: string) => Promise<void>;
}

/** US-147/157/159: 全展開/折りたたみのトリガーを受け取り、expanded を更新。
 * US-159: デフォルト全展開のため expandAll 初期値を 1 にし、全 depth で defaultExpanded=true。 */
function useExpandTrigger(isExpandable: boolean, defaultExpanded: boolean) {
  const triggers = useContext(ExpandTriggerContext);
  const [expanded, setExpanded] = useState(() => {
    if (!isExpandable) return false;
    if (triggers.collapseAll > 0) return false;
    if (triggers.expandAll > 0) return true;
    return defaultExpanded;
  });

  useEffect(() => {
    if (!isExpandable || triggers.expandAll === 0) return;
    setExpanded(true);
  }, [triggers.expandAll, isExpandable]);

  useEffect(() => {
    if (!isExpandable || triggers.collapseAll === 0) return;
    setExpanded(false);
  }, [triggers.collapseAll, isExpandable]);

  return [expanded, setExpanded] as const;
}

function FieldRow({
  path,
  keyName,
  value,
  depth,
  templateDescriptions,
  analysisDescriptions,
  knownFieldPaths,
  maskEnabled = false,
  definitionEditable,
  onDescriptionSave,
}: FieldRowProps) {
  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  /** US-159: デフォルト全展開のため depth に関わらず true */
  const [expanded, setExpanded] = useExpandTrigger(isExpandable, true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const type = getType(value);

  const templateDesc = templateDescriptions?.get(path);
  const analysisDesc = analysisDescriptions?.[keyName] || analysisDescriptions?.[path];
  const description = templateDesc || analysisDesc || null;

  /** US-149: テンプレートまたは AI 分析に説明があれば「未知」を表示しない */
  const isKnown = !knownFieldPaths || knownFieldPaths.has(path) ||
    [...(knownFieldPaths || [])].some((p) => p.startsWith(path + "."));
  const isUnknown = knownFieldPaths && !isKnown && !description;

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
        <td className={`py-1.5 px-2 font-mono text-xs ${typeColor} break-all whitespace-pre-wrap min-w-0`}>
          {isExpandable ? (
            <span className="text-slate-400">{isArray ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}</span>
          ) : (
            <span
              className="cursor-pointer group-hover:underline"
              title="クリックでコピー"
              onClick={() => handleCopy(shouldMask(path, keyName, maskEnabled) ? "[masked]" : typeof value === "string" ? value : String(value), "value")}
            >
              {copiedField === "value" ? "Copied!" : (shouldMask(path, keyName, maskEnabled) ? "***" : formatValue(value))}
            </span>
          )}
        </td>
        <td className="py-1.5 px-2 text-xs text-slate-400 dark:text-dim-text-muted font-mono">
          {type}
        </td>
        <td className="py-1.5 px-2 text-xs text-slate-500 dark:text-slate-400 break-all whitespace-pre-wrap min-w-0">
          {editingDesc ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                className="w-full rounded border border-slate-500 bg-slate-800 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!onDescriptionSave) return;
                    setSaving(true);
                    try {
                      await onDescriptionSave(path, editValue.trim());
                      setEditingDesc(false);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-green-700/50 text-green-200 hover:bg-green-700 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingDesc(false); setEditValue(description || ""); }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/50 text-slate-300 hover:bg-slate-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : description && definitionEditable && onDescriptionSave ? (
            <button
              type="button"
              onClick={() => { setEditValue(description); setEditingDesc(true); }}
              className="text-left w-full hover:bg-slate-700/50 rounded px-1 -mx-1 cursor-pointer group/btn"
              title="クリックして編集"
            >
              <span className="group-hover/btn:underline">{description}</span>
              <span className="ml-1 opacity-0 group-hover/btn:opacity-70 text-slate-500">✎</span>
            </button>
          ) : description ? (
            description
          ) : (
            <span className="text-slate-300 dark:text-slate-600">-</span>
          )}
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
            <td colSpan={4} className="p-0 align-top">
              {/* US-120: ネスト行の列幅を親と揃える */}
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "33.33%" }} />
                  <col style={{ width: "4rem" }} />
                  <col />
                </colgroup>
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
                        maskEnabled={maskEnabled}
                        definitionEditable={definitionEditable}
                        onDescriptionSave={onDescriptionSave}
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
                        maskEnabled={maskEnabled}
                        definitionEditable={definitionEditable}
                        onDescriptionSave={onDescriptionSave}
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
  maskEnabled = false,
  definitionEditable,
  onDescriptionSave,
}: PayloadTableProps) {
  /** US-159: 初期表示で全階層を展開するため 1 で初期化 */
  const [expandTrigger, setExpandTrigger] = useState(1);
  const [collapseTrigger, setCollapseTrigger] = useState(0);

  return (
    <ExpandTriggerContext.Provider value={{ expandAll: expandTrigger, collapseAll: collapseTrigger }}>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-end gap-1 py-1.5 px-2 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setExpandTrigger((c) => c + 1)}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-600/50 text-slate-300 hover:bg-slate-600"
          >
            全展開
          </button>
          <button
            type="button"
            onClick={() => setCollapseTrigger((c) => c + 1)}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-600/50 text-slate-300 hover:bg-slate-600"
          >
            全折りたたみ
          </button>
        </div>
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "33.33%" }} />
            <col style={{ width: "4rem" }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
              <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted">key</th>
              <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted">value</th>
              <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted">type</th>
              <th className="py-2 px-2 text-xs font-medium text-slate-500 dark:text-dim-text-muted">description</th>
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
              maskEnabled={maskEnabled}
              definitionEditable={definitionEditable}
              onDescriptionSave={onDescriptionSave}
            />
          ))}
        </tbody>
        </table>
      </div>
    </ExpandTriggerContext.Provider>
  );
}
