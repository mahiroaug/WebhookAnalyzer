/**
 * source 別アイコン（US-119）
 * fireblocks / bitgo / alchemy / quicknode 等の既知サービス用 + 未知はジェネリック
 */
interface SourceIconProps {
  source: string;
  className?: string;
}

function IconSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      {children}
    </svg>
  );
}

const KNOWN_SOURCES: Record<string, React.ReactNode> = {
  fireblocks: <IconSvg><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></IconSvg>,
  bitgo: <IconSvg><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-4 4 4h-3v4h-2z" /></IconSvg>,
  alchemy: <IconSvg><path d="M12 2L4 6v6l8 4 8-4V6l-8-4zm0 11l-4-2V8l4 2 4-2v3l-4 2z" /></IconSvg>,
  quicknode: (
    <IconSvg>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </IconSvg>
  ),
};

/** ジェネリック（未知の source 用） */
function GenericIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function SourceIcon({ source, className = "w-4 h-4 text-slate-500 dark:text-dim-text-muted" }: SourceIconProps) {
  const key = source?.toLowerCase().trim() || "";
  const icon = key && KNOWN_SOURCES[key]
    ? KNOWN_SOURCES[key]
    : <GenericIcon className={className} />;
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} title={source}>
      {icon}
    </span>
  );
}
