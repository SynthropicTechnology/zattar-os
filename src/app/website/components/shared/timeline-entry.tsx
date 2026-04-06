import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TimelineEntryProps {
  title: string;
  subtitle?: string;
  status?: string;
  icon?: ReactNode;
  /** Color for the timeline dot */
  dotColor?: string;
  isLast?: boolean;
  className?: string;
}

/**
 * Timeline entry for process tracking pages.
 * Shows dot + title + optional subtitle + status on the right.
 */
export function TimelineEntry({
  title,
  subtitle,
  status,
  dotColor = "bg-primary",
  isLast = false,
  className,
}: TimelineEntryProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-5 px-4 -mx-4 rounded-lg",
        "hover:bg-primary/5 transition-colors",
        !isLast && "border-b border-white/5",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-3 h-3 rounded-full shrink-0", dotColor)} />
        <div>
          <p className="font-bold text-on-surface">{title}</p>
          {subtitle && (
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      </div>
      {status && (
        <span className="text-xs font-bold text-on-surface-variant">
          {status}
        </span>
      )}
    </div>
  );
}
