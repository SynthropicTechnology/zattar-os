/**
 * CurrentTimeLine — Indicador de tempo atual com pulso
 * ============================================================================
 * Linha horizontal com dot pulsante mostrando o horario atual.
 * Usado em timelines, day views e week views de qualquer calendario.
 * ============================================================================
 */

"use client";

import { cn } from "@/lib/utils";

export interface CurrentTimeLineProps {
  /** Largura da coluna de label a esquerda (ex: "w-11") */
  labelWidth?: string;
  className?: string;
}

export function CurrentTimeLine({ labelWidth = "w-11", className }: CurrentTimeLineProps) {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className={cn("flex items-center gap-3 py-0.5 -my-0.5 z-10 relative", className)}>
      <span className={cn("text-right text-[10px] tabular-nums text-primary font-semibold shrink-0", labelWidth)}>
        {t}
      </span>
      <div className="size-2 rounded-full bg-primary shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h/0.35)] animate-pulse shrink-0" />
      <div className="flex-1 h-px bg-primary/25" />
    </div>
  );
}
