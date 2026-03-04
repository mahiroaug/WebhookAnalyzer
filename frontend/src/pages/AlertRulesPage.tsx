/** US-146: 異常検知ルールの管理 */
import { useEffect, useState } from "react";
import {
  listAlertRules,
  createAlertRule,
  deleteAlertRule,
  type AlertRule,
} from "../services/api";

export function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", path: "", op: "==", value: "" });

  useEffect(() => {
    let cancelled = false;
    listAlertRules().then((r) => { if (!cancelled) setRules(r); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.path.trim()) return;
    setAdding(true);
    try {
      const value = form.value.trim();
      const parsedValue = /^-?\d+$/.test(value) ? parseInt(value, 10) : /^-?\d+\.\d+$/.test(value) ? parseFloat(value) : value;
      await createAlertRule({ ...form, value: parsedValue });
      setForm({ name: "", path: "", op: "==", value: "" });
      const r = await listAlertRules();
      setRules(r);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAlertRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-800 dark:text-dim-text mb-4">検知ルール</h1>
      <p className="text-sm text-slate-500 dark:text-dim-text-muted mb-4">
        条件を満たす Webhook にバッジ・ハイライトが表示されます。
      </p>

      <div className="mb-6 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
        <h2 className="text-sm font-medium mb-3">ルールを追加</h2>
        <div className="grid grid-cols-[auto_1fr] gap-2 items-center text-sm">
          <label className="text-slate-500">名前</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="例: 高額送金"
            className="rounded border border-slate-400 px-2 py-1"
          />
          <label className="text-slate-500">パス</label>
          <input
            value={form.path}
            onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
            placeholder="例: data.amount"
            className="rounded border border-slate-400 px-2 py-1 font-mono"
          />
          <label className="text-slate-500">演算子</label>
          <select
            value={form.op}
            onChange={(e) => setForm((f) => ({ ...f, op: e.target.value }))}
            className="rounded border border-slate-400 px-2 py-1"
          >
            <option value="==">==</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
            <option value="contains">contains</option>
          </select>
          <label className="text-slate-500">値</label>
          <input
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="例: 1000000 または failed"
            className="rounded border border-slate-400 px-2 py-1 font-mono"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !form.name.trim() || !form.path.trim()}
          className="mt-3 px-3 py-1.5 rounded border border-slate-500 text-sm disabled:opacity-40"
        >
          {adding ? "追加中..." : "追加"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">読み込み中...</div>
      ) : rules.length === 0 ? (
        <div className="text-sm text-slate-500">ルールがありません</div>
      ) : (
        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm"
            >
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 font-mono text-slate-500 text-xs">
                  {r.path} {r.op} {String(r.value)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
