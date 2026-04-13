'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string | number;
  badge: ReactNode;
  date: string;
  text: string;
  subtext?: string;
  isCurrent?: boolean;
}

export interface GazetteTimelineProps {
  items: TimelineItem[];
}

// ─── GazetteTimeline ────────────────────────────────────────────────────────

export function GazetteTimeline({ items }: GazetteTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className="relative flex flex-col gap-3">
      {/* Vertical line */}
      <div
        className="absolute left-1.25op-2 bottom-2 w-px bg-border/50"
        aria-hidden
      />

      {items.map((item) => (
        <div key={item.id} className="relative flex items-start gap-3 pl-5">
          {/* Dot */}
          <div
            className={cn(
              'absolute left-0 top-2.5 w-2 h-2 rounded-full z-10',
              item.isCurrent
                ? 'bg-primary shadow-[0_0_6px] shadow-primary/40'
                : 'border-2 border-muted-foreground/15 bg-transparent',
            )}
            aria-hidden
          />

          {/* Card */}
          <div
            className={cn(
              'flex-1 rounded-lg p-2',
              item.isCurrent
                ? 'bg-primary/4 border border-primary/10'
                : 'bg-muted/20 border border-border/30',
            )}
          >
            {/* Header: badge + date */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="shrink-0">{item.badge}</div>
              <span className="text-[10px] text-muted-foreground/25 whitespace-nowrap">
                {item.date}
              </span>
            </div>

            {/* Text */}
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {item.text}
            </p>

            {/* Subtext (deadline warning) */}
            {item.subtext && (
              <p className="text-[9px] text-destructive/60 mt-0.5">
                {item.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
