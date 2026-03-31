/**
 * ProgressItem — Card compacto com barra de progresso
 * ============================================================================
 * Exibe um item com titulo, subtitulo, e barra de progresso colorida.
 * Usado em radares de preparacao, checklists de progresso, etc.
 * ============================================================================
 */

"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_MAP, type EventColor } from "@/features/calendar/briefing-domain";

export interface ProgressItemProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  color?: EventColor;
  /** Progresso de 0 a 100 */
  progress: number;
  /** Labels para a barra (ex: "2/5 docs", "1/3 test.") */
  leftLabel?: string;
  rightLabel?: string;
  onClick?: () => void;
  className?: string;
}

export function ProgressItem({
  title,
  subtitle,
  icon: Icon,
  color = "violet",
  progress,
  leftLabel,
  rightLabel,
  onClick,
  className,
}: ProgressItemProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.violet;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "flex items-start gap-2 p-2.5 rounded-xl border border-border/8 transition-all",
        onClick && "hover:border-border/15 cursor-pointer",
        className,
      )}
    >
      {Icon && (
        <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5", c.bg)}>
          <Icon className={cn("size-2.5", c.text)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-[10px] font-medium text-foreground truncate">{title}</h4>
          {subtitle && (
            <span className="text-[9px] tabular-nums text-muted-foreground/55 shrink-0">{subtitle}</span>
          )}
        </div>
        <div className="mt-1.5 h-0.5 rounded-full bg-border/8 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              progress === 100 ? "bg-success/50" : progress >= 50 ? "bg-warning/50" : "bg-destructive/50",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {(leftLabel || rightLabel) && (
          <div className="flex items-center justify-between mt-1">
            {leftLabel && <span className="text-[8px] text-muted-foreground/50">{leftLabel}</span>}
            {rightLabel && <span className="text-[8px] text-muted-foreground/50">{rightLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
