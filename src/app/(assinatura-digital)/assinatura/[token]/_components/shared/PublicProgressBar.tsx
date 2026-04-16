"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PublicProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function PublicProgressBar({
  current,
  total,
  showLabel = false,
  className,
}: PublicProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Passo {current} de {total}
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Passo ${current} de ${total}`}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
