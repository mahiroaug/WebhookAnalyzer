/**
 * source 別イニシャルアイコン（US-131）
 * source 名の頭文字を丸背景 + 白文字で表示。source ごとに背景色が異なる。
 */

interface SourceIconProps {
  source: string;
  size?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  fireblocks: "bg-orange-500",
  bitgo: "bg-blue-500",
  alchemy: "bg-purple-500",
  quicknode: "bg-green-500",
};

const DEFAULT_COLOR = "bg-slate-500";

export function SourceIcon({ source, size = "w-5 h-5" }: SourceIconProps) {
  const key = source?.toLowerCase().trim() || "";
  const initial = (key[0] || "?").toUpperCase();
  const color = SOURCE_COLORS[key] || DEFAULT_COLOR;

  return (
    <span
      className={`${size} ${color} rounded-full inline-flex items-center justify-center shrink-0 text-white text-[10px] font-bold leading-none`}
      title={source}
    >
      {initial}
    </span>
  );
}
