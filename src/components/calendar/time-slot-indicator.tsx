/**
 * TimeSlotIndicator — Indicador de slot de tempo (foco, intervalo, deslocamento)
 * ============================================================================
 * Componente generico para mostrar blocos de tempo entre eventos na timeline.
 * Variantes: "focus" (janela de foco), "break" (intervalo), "travel" (deslocamento).
 * ============================================================================
 */

"use client";

import { Brain, Coffee, MapPin, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimeSlotVariant = "focus" | "break" | "travel";

export interface TimeSlotIndicatorProps {
  variant: TimeSlotVariant;
  startTime: string;
  endTime?: string;
  label?: string;
  /** Apenas para variant="travel" */
  minutes?: number;
  /** Largura da coluna de label (ex: "w-11") */
  labelWidth?: string;
  className?: string;
}

const VARIANT_CONFIG: Record<TimeSlotVariant, {
  icon: LucideIcon;
  defaultLabel: string;
  containerClass: string;
  iconClass: string;
  labelClass: string;
  dotClass: string;
}> = {
  focus: {
    icon: Brain,
    defaultLabel: "Foco",
    containerClass: "border-dashed border-success/10 bg-success/[0.015]",
    iconClass: "text-success/30",
    labelClass: "text-success/40",
    dotClass: "border-dashed border-success/25",
  },
  break: {
    icon: Coffee,
    defaultLabel: "Intervalo",
    containerClass: "border-dashed border-muted-foreground/8 bg-muted/[0.01]",
    iconClass: "text-muted-foreground/45",
    labelClass: "text-muted-foreground/45",
    dotClass: "border-dashed border-muted-foreground/10",
  },
  travel: {
    icon: MapPin,
    defaultLabel: "Deslocamento",
    containerClass: "border-warning/8 bg-warning/[0.03]",
    iconClass: "text-warning/35",
    labelClass: "text-warning/50",
    dotClass: "border-warning/20",
  },
};

export function TimeSlotIndicator({
  variant,
  startTime,
  endTime,
  label,
  minutes,
  labelWidth = "w-11",
  className,
}: TimeSlotIndicatorProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;
  const displayLabel = label ?? (variant === "travel" && minutes ? `~${minutes}min deslocamento` : cfg.defaultLabel);

  // Travel variant: compact, no time label
  if (variant === "travel") {
    return (
      <div className={cn("flex items-center gap-3 py-0.5", className)}>
        <span className={cn("shrink-0", labelWidth)} />
        <MapPin className="size-1.5 text-warning/30 shrink-0" />
        <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md border", cfg.containerClass)}>
          <MapPin className="size-2 text-warning/35" />
          <span className="text-[8px] text-warning/50 font-medium">{displayLabel}</span>
        </div>
      </div>
    );
  }

  // Focus and break variants: full width with time range
  return (
    <div className={cn("flex items-center gap-3 py-1", className)}>
      <span className={cn("text-right text-[10px] tabular-nums shrink-0", labelWidth, variant === "break" ? "text-muted-foreground/60" : "text-muted-foreground/45")}>
        {startTime}
      </span>
      <div className={cn("size-1.5 rounded-full border shrink-0", cfg.dotClass)} />
      <div className={cn("flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border", cfg.containerClass)}>
        <Icon className={cn("size-2.5", cfg.iconClass)} />
        <span className={cn("text-[9px] font-medium", cfg.labelClass)}>{displayLabel}</span>
        {endTime && (
          <span className="text-[9px] tabular-nums text-muted-foreground/60 ml-auto">
            {startTime}–{endTime}
          </span>
        )}
      </div>
    </div>
  );
}
