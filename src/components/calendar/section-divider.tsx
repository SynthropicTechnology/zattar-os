/**
 * SectionDivider — Divisor de secao com icone e label
 * ============================================================================
 * Separador visual para agrupar conteudo em fases/secoes (ex: "Manha", "Tarde").
 * Reutilizavel em timelines, listas agrupadas, e qualquer layout vertical.
 * ============================================================================
 */

"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionDividerProps {
  label: string;
  icon?: LucideIcon;
  className?: string;
}

export function SectionDivider({ label, icon: Icon, className }: SectionDividerProps) {
  return (
    <div className={cn("flex items-center gap-2 pt-4 pb-1.5 first:pt-0", className)}>
      {Icon && <Icon className="size-2.5 text-muted-foreground/15" />}
      <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/20 font-semibold">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}
