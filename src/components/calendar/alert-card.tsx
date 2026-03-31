/**
 * AlertCard — Card de alerta semantico
 * ============================================================================
 * Exibe alertas contextuais com icone, titulo e descricao.
 * Variantes: warning, destructive, info, success.
 * Reutilizavel em agendas, dashboards, formularios, etc.
 * ============================================================================
 */

"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertCardVariant = "warning" | "destructive" | "info" | "success";

export interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: AlertCardVariant;
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<AlertCardVariant, {
  bg: string;
  border: string;
  icon: string;
  title: string;
}> = {
  warning: {
    bg: "bg-warning/[0.03]",
    border: "border-warning/10",
    icon: "text-warning/50",
    title: "text-warning/70",
  },
  destructive: {
    bg: "bg-destructive/[0.03]",
    border: "border-destructive/10",
    icon: "text-destructive/50",
    title: "text-destructive/70",
  },
  info: {
    bg: "bg-info/[0.03]",
    border: "border-info/10",
    icon: "text-info/50",
    title: "text-info/70",
  },
  success: {
    bg: "bg-success/[0.03]",
    border: "border-success/10",
    icon: "text-success/50",
    title: "text-success/70",
  },
};

export function AlertCard({
  icon: Icon,
  title,
  description,
  variant = "warning",
  onClick,
  className,
}: AlertCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "p-2.5 rounded-xl border flex items-start gap-2",
        styles.bg, styles.border,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className,
      )}
    >
      <Icon className={cn("size-3 mt-0.5 shrink-0", styles.icon)} />
      <div className="min-w-0">
        <h4 className={cn("text-[10px] font-medium leading-tight", styles.title)}>{title}</h4>
        {description && (
          <p className="text-[9px] text-muted-foreground/30 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
