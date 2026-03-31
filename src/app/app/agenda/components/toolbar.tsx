/**
 * AgendaToolbar — Barra de controles da Agenda
 * ============================================================================
 * Search, filtro por fonte, date nav, view switcher, novo evento.
 * Reutiliza: SearchInput, ViewToggle do design system.
 * ============================================================================
 */

"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/dashboard/search-input";
import { ViewToggle, type ViewToggleOption } from "@/components/dashboard/view-toggle";
import type { CalendarSource } from "@/features/calendar/domain";
import { SOURCE_CONFIG, type CalendarView } from "@/features/calendar/briefing-domain";
import { monthName, fmtDateFull, startOfWeek, addDays, weekdayShort } from "@/features/calendar/briefing-helpers";

// ─── View Options ──────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "month", icon: CalendarRange, label: "Mês" },
  { id: "week", icon: CalendarDays, label: "Semana" },
  { id: "day", icon: Calendar, label: "Dia" },
  { id: "agenda", icon: List, label: "Lista" },
  { id: "briefing", icon: Sparkles, label: "Briefing" },
];

// ─── Props ─────────────────────────────────────────────────────────────

export interface AgendaToolbarProps {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  sourceFilter: Set<CalendarSource>;
  onToggleSource: (s: CalendarSource) => void;
  onNewEvent: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AgendaToolbar({
  view,
  onViewChange,
  currentDate,
  onPrev,
  onNext,
  onToday,
  search,
  onSearchChange,
  sourceFilter,
  onToggleSource,
  onNewEvent,
}: AgendaToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const dateLabel = useMemo(() => {
    if (view === "month") return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()}–${end.getDate()} de ${monthName(start).toLowerCase()}`;
      }
      return `${start.getDate()} ${monthName(start).slice(0, 3).toLowerCase()} – ${end.getDate()} ${monthName(end).slice(0, 3).toLowerCase()}`;
    }
    if (view === "day" || view === "briefing") return fmtDateFull(currentDate);
    return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  const activeFilters = sourceFilter.size;

  return (
    <div className="space-y-3">
      {/* Row 1: Title + New Event */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{dateLabel}</p>
        </div>
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Novo evento</span>
        </button>
      </div>

      {/* Row 2: Search + Filters + Nav + View */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search (reusa SearchInput existente) */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar eventos..."
          className="flex-1 max-w-56"
        />

        {/* Source Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer",
              activeFilters > 0
                ? "border-primary/20 bg-primary/6 text-primary"
                : "border-border/15 text-muted-foreground/50 hover:text-muted-foreground/70",
            )}
          >
            Tipo
            {activeFilters > 0 && (
              <span className="text-[9px] px-1 py-0.5 rounded-full bg-primary/15 tabular-nums">{activeFilters}</span>
            )}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 w-48 p-1.5 rounded-xl border border-border/20 bg-background shadow-lg">
                {(Object.keys(SOURCE_CONFIG) as CalendarSource[]).map((src) => {
                  const cfg = SOURCE_CONFIG[src];
                  const active = sourceFilter.has(src);
                  return (
                    <button
                      key={src}
                      onClick={() => onToggleSource(src)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/4 transition-colors cursor-pointer"
                    >
                      <div className={cn(
                        "size-3.5 rounded border flex items-center justify-center",
                        active ? "bg-primary border-primary" : "border-border/30",
                      )}>
                        {active && <Check className="size-2.5 text-primary-foreground" />}
                      </div>
                      <span className={cn(active ? "text-foreground" : "text-muted-foreground/60")}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Date Nav */}
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={onToday} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer">
            Hoje
          </button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* View Switcher (reusa ViewToggle existente) */}
        <ViewToggle
          mode={view}
          onChange={(m) => onViewChange(m as CalendarView)}
          options={VIEW_OPTIONS}
        />
      </div>
    </div>
  );
}
