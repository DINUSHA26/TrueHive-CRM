import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state-box flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 ${className}`}
    >
      <div className="empty-state-icon p-3 rounded-2xl bg-slate-800/60 text-slate-400 mb-3">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h4 className="empty-state-title text-sm font-semibold text-white mb-1">{title}</h4>
      <p className="empty-state-desc text-xs text-slate-400 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

