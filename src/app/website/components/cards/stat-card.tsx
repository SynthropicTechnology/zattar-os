import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  /** Percentage change (positive = up, negative = down) */
  change?: number;
  changeLabel?: string;
  className?: string;
}

/**
 * Bento stat card — shows a metric with icon, value, and optional trend indicator.
 * Used in portal dashboards and financial pages.
 */
export function StatCard({
  label,
  value,
  icon,
  change,
  changeLabel,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "bg-surface-container rounded-xl p-8 flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      <div className="flex justify-between items-start mb-8">
        <span className="text-on-surface-variant text-sm font-medium">
          {label}
        </span>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black font-headline tracking-tighter text-on-surface">
          {value}
        </h3>
        {change !== undefined && (
          <p
            className={cn(
              "text-xs flex items-center gap-1 mt-2 font-semibold",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}
            {change}%{changeLabel && ` ${changeLabel}`}
          </p>
        )}
      </div>
    </div>
  );
}
