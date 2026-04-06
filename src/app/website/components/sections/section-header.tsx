import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Additional content rendered alongside the title (e.g., action buttons) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Reusable Kicker → Headline → Body pattern from the Magistrate AI design system.
 * Used at the top of every section across both website and portal pages.
 */
export function SectionHeader({
  kicker,
  title,
  description,
  align = "left",
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-6",
        align === "center" && "md:flex-col md:items-center text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {kicker && (
          <span className="label-md mb-4 block">{kicker}</span>
        )}
        <h2 className="headline-lg text-on-surface">{title}</h2>
        {description && (
          <p className="body-editorial mt-4 max-w-lg">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-4 shrink-0">{actions}</div>}
    </div>
  );
}
