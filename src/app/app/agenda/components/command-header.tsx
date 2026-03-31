/**
 * CommandHeader — Stats + Week Pulse unificados
 * ============================================================================
 * Painel de comando compacto mostrando metricas do dia e intensidade da semana.
 * Linha 1: Stats (eventos, audiencias, ocupado, foco, alertas)
 * Linha 2: Week Pulse (7 barras de intensidade)
 * ============================================================================
 */

"use client";

import {
  Calendar,
  Clock,
  Gavel,
  Brain,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/app/app/dashboard/mock/widgets/primitives";
import type { DaySummary, WeekPulseDay } from "@/features/calendar/briefing-domain";

// ─── Props ─────────────────────────────────────────────────────────────

export interface CommandHeaderProps {
  summary: DaySummary;
  weekPulse: WeekPulseDay[];
}

// ─── Helpers ───────────────────────────────────────────────────────────

function intensityColor(h: number) {
  if (h === 0) return "bg-border/8";
  if (h <= 3) return "bg-success/30";
  if (h <= 5) return "bg-primary/35";
  if (h <= 7) return "bg-warning/35";
  return "bg-destructive/35";
}

// ─── Component ─────────────────────────────────────────────────────────

export function CommandHeader({ summary, weekPulse }: CommandHeaderProps) {
  const maxH = Math.max(...weekPulse.map((d) => d.horas), 1);

  const stats = [
    { icon: Calendar, value: String(summary.total), label: "eventos", color: "text-primary" },
    { icon: Gavel, value: String(summary.audiencias), label: "audiências", color: "text-primary" },
    { icon: Clock, value: summary.horasOcupado, label: "ocupado", color: "text-warning" },
    { icon: Brain, value: summary.horasFoco, label: "foco livre", color: "text-success" },
    { icon: AlertTriangle, value: String(summary.alertas), label: "alertas", color: "text-destructive" },
  ];

  return (
    <GlassPanel depth={2} className="p-4 sm:p-5">
      {/* Stats row */}
      <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-3 border-b border-border/10">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 min-w-max">
            {i > 0 && <div className="w-px h-6 bg-border/8 shrink-0 hidden sm:block" />}
            <s.icon className={cn("size-3 opacity-40 shrink-0", s.color)} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-sm font-bold tabular-nums">{s.value}</span>
              <span className="text-[9px] text-muted-foreground/35 hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Week pulse row */}
      <div className="flex items-end justify-between gap-1.5 sm:gap-2 pt-3">
        {weekPulse.map((day) => {
          const h = day.horas > 0 ? Math.max(14, (day.horas / maxH) * 100) : 6;
          return (
            <div key={day.dia} className="flex flex-col items-center gap-1 flex-1">
              <span className={cn(
                "text-[9px] tabular-nums font-medium",
                day.hoje ? "text-primary" : day.eventos > 0 ? "text-muted-foreground/40" : "text-muted-foreground/15",
              )}>
                {day.eventos || "–"}
              </span>
              <div
                className={cn(
                  "w-2.5 sm:w-3 rounded-full transition-all duration-500",
                  intensityColor(day.horas),
                  day.hoje && "ring-1 ring-primary/25 ring-offset-1 ring-offset-transparent",
                )}
                style={{ height: `${h}%`, minHeight: 4, maxHeight: 36 }}
              />
              <span className={cn(
                "text-[9px] font-medium",
                day.hoje ? "text-primary font-semibold" : "text-muted-foreground/30",
              )}>
                {day.dia}
              </span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
