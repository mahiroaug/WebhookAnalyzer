/**
 * US-142: 既存定義 vs AI 分析結果の diff を表示し、マージ・スキップ・部分的適用を選択
 */
import { useState } from "react";

export interface DefinitionDiff {
  added: Array<{ path: string; description: string }>;
  removed: Array<{ path: string; description: string }>;
  changed: Array<{ path: string; oldDesc: string; newDesc: string }>;
  summaryChanged: boolean;
  oldSummary: string;
  newSummary: string;
}

export interface PartialApplyPayload {
  summary?: string;
  field_descriptions: Record<string, string>;
  removed_paths: string[];
}

interface DefinitionDiffModalProps {
  diff: DefinitionDiff;
  newResult: { summary?: string | null; field_descriptions: Record<string, string> };
  onMerge: () => Promise<void>;
  onSkip: () => void;
  onPartialApply: (payload: PartialApplyPayload) => Promise<void>;
}

export function DefinitionDiffModal({
  diff,
  newResult,
  onMerge,
  onSkip,
  onPartialApply,
}: DefinitionDiffModalProps) {
  const [applying, setApplying] = useState(false);
  const [partialMode, setPartialMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectedSummary, setSelectedSummary] = useState(true);

  const hasChanges =
    diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0 || diff.summaryChanged;

  const togglePath = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleMerge = async () => {
    setApplying(true);
    try {
      await onMerge();
    } finally {
      setApplying(false);
    }
  };

  const handlePartial = async () => {
    const field_descriptions: Record<string, string> = {};
    const removed_paths: string[] = [];
    for (const p of selectedPaths) {
      if (p.startsWith("add:")) {
        const path = p.slice(5);
        field_descriptions[path] = newResult.field_descriptions[path] ?? "";
      } else if (p.startsWith("change:")) {
        const path = p.slice(8);
        field_descriptions[path] = newResult.field_descriptions[path] ?? "";
      } else if (p.startsWith("remove:")) {
        removed_paths.push(p.slice(8));
      }
    }
    const payload: PartialApplyPayload = {
      field_descriptions,
      removed_paths,
    };
    if (selectedSummary && diff.summaryChanged) {
      payload.summary = newResult.summary ?? undefined;
    }
    setApplying(true);
    try {
      await onPartialApply(payload);
    } finally {
      setApplying(false);
    }
  };

  if (!hasChanges) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 p-4 shadow-xl">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">定義ファイルとの差分</h3>

        {diff.summaryChanged && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-slate-400 mb-1">概要</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-400">既存:</span>
                <p className="mt-0.5 text-slate-300 whitespace-pre-wrap">{diff.oldSummary || "(空)"}</p>
              </div>
              <div>
                <span className="text-green-400">新規:</span>
                <p className="mt-0.5 text-slate-300 whitespace-pre-wrap">{diff.newSummary || "(空)"}</p>
              </div>
            </div>
            {partialMode && (
              <label className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={selectedSummary}
                  onChange={(e) => setSelectedSummary(e.target.checked)}
                />
                概要を適用
              </label>
            )}
          </div>
        )}

        {diff.added.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-green-400 mb-1">追加</h4>
            <ul className="space-y-1">
              {diff.added.map(({ path, description }) => (
                <li key={path} className="flex items-start gap-2 text-xs">
                  {partialMode && (
                    <input
                      type="checkbox"
                      checked={selectedPaths.has(`add:${path}`)}
                      onChange={() => togglePath(`add:${path}`)}
                    />
                  )}
                  <span className="font-mono text-[#D4A574] shrink-0">{path}:</span>
                  <span className="text-slate-300">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {diff.removed.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-red-400 mb-1">削除</h4>
            <ul className="space-y-1">
              {diff.removed.map(({ path, description }) => (
                <li key={path} className="flex items-start gap-2 text-xs">
                  {partialMode && (
                    <input
                      type="checkbox"
                      checked={selectedPaths.has(`remove:${path}`)}
                      onChange={() => togglePath(`remove:${path}`)}
                    />
                  )}
                  <span className="font-mono text-[#D4A574] shrink-0">{path}:</span>
                  <span className="text-slate-400 line-through">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {diff.changed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-amber-400 mb-1">変更</h4>
            <ul className="space-y-2">
              {diff.changed.map(({ path, oldDesc, newDesc }) => (
                <li key={path} className="text-xs">
                  {partialMode && (
                    <label className="flex items-center gap-1 mb-0.5">
                      <input
                        type="checkbox"
                        checked={selectedPaths.has(`change:${path}`)}
                        onChange={() => togglePath(`change:${path}`)}
                      />
                      <span className="font-mono text-[#D4A574]">{path}</span>
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-2 pl-4">
                    <div>
                      <span className="text-red-400">既存:</span>
                      <p className="text-slate-400 line-through">{oldDesc}</p>
                    </div>
                    <div>
                      <span className="text-green-400">新規:</span>
                      <p className="text-slate-300">{newDesc}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleMerge}
            disabled={applying}
            className="rounded border border-green-600 bg-green-800/50 px-3 py-1.5 text-sm text-green-200 hover:bg-green-700 disabled:opacity-50"
          >
            {applying ? "適用中..." : "すべてマージ"}
          </button>
          <button
            type="button"
            onClick={() => setPartialMode(!partialMode)}
            className="rounded border border-slate-500 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
          >
            {partialMode ? "戻る" : "部分的に適用"}
          </button>
          {partialMode && (
            <button
              type="button"
              onClick={handlePartial}
              disabled={applying}
              className="rounded border border-amber-600 bg-amber-800/50 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-700 disabled:opacity-50"
            >
              選択だけマージ
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            disabled={applying}
            className="rounded border border-slate-500 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  );
}

/** diff を計算 */
export function computeDiff(
  existing: { summary: string; field_descriptions: Record<string, string> },
  newResult: { summary?: string | null; field_descriptions: Record<string, string> }
): DefinitionDiff {
  const oldF = existing.field_descriptions || {};
  const newF = newResult.field_descriptions || {};
  const oldPaths = new Set(Object.keys(oldF));
  const newPaths = new Set(Object.keys(newF));

  const added = [...newPaths].filter((p) => !oldPaths.has(p)).map((path) => ({ path, description: newF[path] }));
  const removed = [...oldPaths].filter((p) => !newPaths.has(p)).map((path) => ({ path, description: oldF[path] }));
  const changed = [...oldPaths]
    .filter((p) => newPaths.has(p) && oldF[p] !== newF[p])
    .map((path) => ({ path, oldDesc: oldF[path], newDesc: newF[path] }));

  const oldSummary = existing.summary || "";
  const newSummary = (newResult.summary ?? "") || "";
  const summaryChanged = oldSummary !== newSummary;

  return { added, removed, changed, summaryChanged, oldSummary, newSummary };
}
