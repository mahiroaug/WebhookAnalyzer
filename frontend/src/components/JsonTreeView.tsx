/**
 * ネストされた JSON をツリー形式で表示するコンポーネント。
 * 展開/折りたたみ、キー・型・値の識別、コピー操作、重要フィールドのハイライトをサポート。
 * US-106: コードエディタ風の配色（キー: #D4A574, 文字列: #9FDFBF, 数値: 薄青）
 * US-108: コピー/JSONPathコピーの修正とフィードバック
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** クリップボードにコピー。失敗時は document.execCommand でフォールバック */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // フォールバックへ
  }
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
  } catch {
    return false;
  }
}

/** クリップボードアイコン（24x24） */
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

/** チェックアイコン（24x24） */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** パスアイコン（24x24） */
function PathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** 重要フィールドとしてハイライトするキー名（大文字小文字不問） */
const IMPORTANT_KEYS = new Set([
  "id",
  "amount",
  "status",
  "type",
  "timestamp",
  "created_at",
  "updated_at",
  "transaction_id",
  "tx_id",
  "asset",
  "address",
  "from",
  "to",
]);

function isImportantKey(key: string): boolean {
  return IMPORTANT_KEYS.has(key.toLowerCase());
}

/** payload 内に存在する重要キーを再帰的に収集 */
function collectImportantKeysInPayload(
  obj: unknown,
  prefix = ""
): Set<string> {
  const found = new Set<string>();
  if (obj === null || obj === undefined || typeof obj !== "object") return found;
  const o = obj as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (isImportantKey(key)) found.add(fullKey);
    if (typeof o[key] === "object" && o[key] !== null && !Array.isArray(o[key])) {
      collectImportantKeysInPayload(o[key], fullKey).forEach((k) => found.add(k));
    }
  }
  return found;
}

interface JsonTreeViewProps {
  data: unknown;
  rootKey?: string;
  jsonPath?: string;
  /** 重要フィールド欠損表示を上部に出す場合 true */
  showMissingImportant?: boolean;
  /** 辞書テンプレートに含まれるフィールドパス（例: data.id, data.status）。未指定時は未知フィールドの区別をしない */
  knownFieldPaths?: Set<string>;
}

function getValueType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

/** jsonPath "$.data.id" を "data.id" に正規化 */
function normalizePath(jsonPath: string): string {
  return jsonPath.replace(/^\$\./, "");
}

/** プリミティブ値表示。ホバー時のみコピー・JSONPathアイコン表示（US-108, US-109） */
function PrimitiveValue({
  displayVal,
  rawVal,
  jsonPath,
  valueType,
}: {
  displayVal: string;
  rawVal: string;
  jsonPath: string;
  valueType: string;
}) {
  const [copied, setCopied] = useState<"value" | "path" | null>(null);
  const handleCopy = useCallback(async (text: string, type: "value" | "path") => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(type);
      setTimeout(() => setCopied(null), 1000);
    }
  }, []);
  const iconClass = "w-3.5 h-3.5";
  const valueColorClass =
    valueType === "string" ? "text-[#9FDFBF]" :
    valueType === "number" ? "text-blue-300" :
    valueType === "boolean" ? "text-amber-400" :
    "text-slate-400";
  return (
    <span className="group inline-flex items-center gap-1">
      <span className={valueColorClass}>{displayVal}</span>
      <span className="text-slate-400 text-xs">({valueType})</span>
      <span className={`inline-flex transition-opacity ${copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleCopy(rawVal, "value"); }}
          className="ml-1 p-0.5 rounded hover:bg-slate-600/60 text-slate-400 hover:text-slate-200"
          title="値をコピー"
        >
          {copied === "value" ? (
            <CheckIcon className={`${iconClass} text-emerald-400`} />
          ) : (
            <ClipboardIcon className={iconClass} />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleCopy(jsonPath, "path"); }}
          className="p-0.5 rounded hover:bg-slate-600/60 text-slate-400 hover:text-slate-200"
          title="JSONPath をコピー"
        >
          {copied === "path" ? (
            <CheckIcon className={`${iconClass} text-emerald-400`} />
          ) : (
            <PathIcon className={iconClass} />
          )}
        </button>
      </span>
    </span>
  );
}

export function JsonTreeView({
  data,
  rootKey = "payload",
  jsonPath = "$",
  showMissingImportant = false,
  knownFieldPaths,
}: JsonTreeViewProps) {
  const foundImportant =
    showMissingImportant && typeof data === "object" && data !== null
      ? collectImportantKeysInPayload(data)
      : new Set<string>();
  const missingImportant =
    showMissingImportant && foundImportant.size > 0
      ? [...IMPORTANT_KEYS].filter(
          (key) =>
            ![...foundImportant].some(
              (f) =>
                f.toLowerCase().endsWith(`.${key}`) ||
                f.toLowerCase() === key
            )
        )
      : [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set([jsonPath]));

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (data === null || data === undefined) {
    return (
      <span className="text-slate-400">{data === null ? "null" : "undefined"}</span>
    );
  }

  if (typeof data !== "object") {
    const val = String(data);
    const displayVal =
      typeof data === "string" ? `"${val.replace(/"/g, '\\"')}"` : val;
    const rawVal = typeof data === "string" ? data : String(data);
    return (
      <PrimitiveValue
        displayVal={displayVal}
        rawVal={rawVal}
        jsonPath={jsonPath}
        valueType={getValueType(data)}
      />
    );
  }

  if (Array.isArray(data)) {
    const path = jsonPath;
    const isOpen = expanded.has(path);
    return (
      <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => toggle(path)}
          className="flex items-center gap-1 text-left hover:bg-slate-800/40 -mx-1 px-1 rounded"
        >
          <span className="text-slate-500">{isOpen ? "▼" : "▶"}</span>
          <span className="font-mono text-[#D4A574]">[array]</span>
          <span className="text-slate-400 text-xs">
            ({data.length} items)
          </span>
        </button>
        <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 space-y-1 overflow-hidden"
          >
            {data.map((item, i) => (
              <div key={i} className="pl-4">
                <span className="font-mono text-slate-500 text-xs">
                  [{i}]
                </span>{" "}
                <JsonTreeView
                  data={item}
                  jsonPath={`${path}[${i}]`}
                />
              </div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  }

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj);
  const path = jsonPath;
  const isOpen = expanded.has(path);

  return (
    <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
      {showMissingImportant && jsonPath === "$" && missingImportant.length > 0 && (
        <div className="mb-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            検出されていない重要フィールド: {missingImportant.join(", ")}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => toggle(path)}
        className="flex items-center gap-1 text-left hover:bg-slate-800/40 -mx-1 px-1 rounded w-full"
      >
        <span className="text-slate-500">{isOpen ? "▼" : "▶"}</span>
        <span className="font-mono text-[#D4A574]">{rootKey}</span>
        <span className="text-slate-400 text-xs">({keys.length} keys)</span>
      </button>
      <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 space-y-1 overflow-hidden"
        >
          {keys.map((key) => {
            const val = obj[key];
            const childPath = path === "$" ? `$.${key}` : `${path}.${key}`;
            const normalizedPath = normalizePath(childPath);
            const isPrimitive =
              val === null ||
              val === undefined ||
              (typeof val !== "object");
            const important = isImportantKey(key);
            const isKnownPath =
              !knownFieldPaths ||
              knownFieldPaths.has(normalizedPath) ||
              [...(knownFieldPaths || [])].some((p) =>
                p.startsWith(normalizedPath + ".")
              );
            const isUnknownField = knownFieldPaths && !isKnownPath;
            const keyClassName = isUnknownField
              ? "text-violet-400 bg-violet-900/30 px-1 rounded border border-dashed border-violet-700"
              : important
                ? "text-[#D4A574] bg-amber-900/20 px-1 rounded"
                : "text-[#D4A574]";
            return (
              <div key={key} className="pl-4">
                <span className={`font-mono font-medium ${keyClassName}`}>
                  {key}
                </span>
                {isUnknownField && (
                  <span
                    className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300"
                    title="辞書テンプレートに未定義のフィールド（追加候補）"
                  >
                    未知
                  </span>
                )}
                {isPrimitive ? (
                  <>
                    <span className="text-slate-500 mx-1">:</span>
                    <JsonTreeView data={val} jsonPath={childPath} />
                  </>
                ) : (
                  <JsonTreeView
                    data={val}
                    rootKey={key}
                    jsonPath={childPath}
                    knownFieldPaths={knownFieldPaths}
                    showMissingImportant={showMissingImportant}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
