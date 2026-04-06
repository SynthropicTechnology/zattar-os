import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  timestamp: string;
  className?: string;
}

/**
 * Activity feed item used in portal dashboards.
 * Shows icon + description + relative timestamp.
 */
export function ActivityItem({
  icon,
  iconBg = "bg-secondary-container",
  title,
  timestamp,
  className,
}: ActivityItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all",
        className
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface">{title}</p>
        <span className="text-[10px] font-bold text-outline uppercase">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
