import type { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function RetroWindow({ title, children, className = "" }: RetroWindowProps) {
  return (
    <div className={`bevel-out bg-panel p-1 ${className}`}>
      <div className="titlebar flex items-center justify-between px-2 py-1">
        <span className="font-pixel truncate text-[10px] sm:text-xs">{title}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="bevel-out block h-4 w-4 bg-panel" />
          <span className="bevel-out block h-4 w-4 bg-panel" />
          <span className="bevel-out block h-4 w-4 bg-panel" />
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}
