/**
 * ネストされた JSON をツリー形式で表示するコンポーネント。
 * 展開/折りたたみ、キー・型・値の識別、コピー操作、重要フィールドのハイライトをサポート。
 */
import { useState } from "react";

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

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

/** jsonPath "$.data.id" を "data.id" に正規化 */
function normalizePath(jsonPath: string): string {
  return jsonPath.replace(/^\$\./, "");
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
      <span className="text-slate-500 dark:text-slate-400">
        {data === null ? "null" : "undefined"}
      </span>
    );
  }

  if (typeof data !== "object") {
    const val = String(data);
    const displayVal =
      typeof data === "string" ? `"${val.replace(/"/g, '\\"')}"` : val;
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-amber-600 dark:text-amber-400">{displayVal}</span>
        <span className="text-slate-400 text-xs">({getValueType(data)})</span>
        <button
          type="button"
          onClick={() => copyToClipboard(displayVal)}
          className="ml-1 px-1.5 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
          title="値をコピー"
        >
          コピー
        </button>
      </span>
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
          className="flex items-center gap-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800 -mx-1 px-1 rounded"
        >
          <span className="text-slate-500">{isOpen ? "▼" : "▶"}</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">
            [array]
          </span>
          <span className="text-slate-400 text-xs">
            ({data.length} items)
          </span>
        </button>
        {isOpen && (
          <div className="mt-1 space-y-1">
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
          </div>
        )}
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
        className="flex items-center gap-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800 -mx-1 px-1 rounded w-full"
      >
        <span className="text-slate-500">{isOpen ? "▼" : "▶"}</span>
        <span className="font-mono text-indigo-600 dark:text-indigo-400">
          {rootKey}
        </span>
        <span className="text-slate-400 text-xs">({keys.length} keys)</span>
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1">
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
              ? "text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1 rounded border border-dashed border-violet-300 dark:border-violet-700"
              : important
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 rounded"
                : "text-emerald-600 dark:text-emerald-400";
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(childPath);
                      }}
                      className="ml-1 px-1.5 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                      title="JSONPath をコピー"
                    >
                      Path
                    </button>
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
        </div>
      )}
    </div>
  );
}
