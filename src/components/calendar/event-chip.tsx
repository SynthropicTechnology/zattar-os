/**
 * EventChip — Badge compacto de evento com cor semantica
 * ============================================================================
 * Usado em views de calendario (month, week, day) para exibir eventos de
 * forma compacta dentro de celulas de grid.
 *
 * Suporta: cores por fonte/status, eventos passados (strikethrough + opacity),
 * formato compacto (sem horario) e formato normal (com horario).
 * ============================================================================
 */

"use client";

import { cn } from "@/lib/utils";
import { COLOR_MAP, type EventColor } from "@/app/app/calendar/briefing-domain";

export interface EventChipProps {
  title: string;
  color: EventColor;
  /** Horario formatado (ex: "09:00"). Omitir para modo compacto. */
  time?: string;
  /** Marca como evento passado (strikethrough + opacity reduzida) */
  past?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EventChip({ title, color, time, past, onClick, className }: EventChipProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.violet;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-colors cursor-pointer border",
        c.bg, c.text, c.border,
        past && "opacity-60 line-through",
        "hover:opacity-80",
        className,
      )}
    >
      {time && <span className="tabular-nums mr-1 opacity-70">{time}</span>}
      {title}
    </button>
  );
}
