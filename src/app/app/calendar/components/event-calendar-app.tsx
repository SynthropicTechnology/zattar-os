"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  Eye,
  List,
  LoaderCircle,
  PlusIcon,
  SearchIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AgendaDaysToShow,
  EventCalendar,
  EventDialog,
  type CalendarEvent,
  type CalendarView
} from "./";
import { actionListarEventosCalendar, type UnifiedCalendarEvent } from "@/features/calendar";
import {
  actionCriarAgendaEvento,
  actionAtualizarAgendaEvento,
  actionDeletarAgendaEvento,
} from "@/features/agenda-eventos";
import { FilterPopoverMulti, type FilterOption } from "@/features/partes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const SOURCE_FILTER_OPTIONS: readonly FilterOption[] = [
  { value: "agenda", label: "Agenda" },
  { value: "audiencias", label: "Audiências" },
  { value: "expedientes", label: "Expedientes" },
  { value: "obrigacoes", label: "Obrigações" },
  { value: "pericias", label: "Perícias" }
];

const CALENDAR_VIEW_OPTIONS = [
  { value: "month" as CalendarView, label: "Mês", icon: CalendarRange, shortcut: "M" },
  { value: "week" as CalendarView, label: "Semana", icon: CalendarDays, shortcut: "W" },
  { value: "day" as CalendarView, label: "Dia", icon: Calendar, shortcut: "D" },
  { value: "agenda" as CalendarView, label: "Agenda", icon: List, shortcut: "A" }
];

const GRAU_LABELS: Record<string, string> = {
  primeiro_grau: "1º Grau",
  segundo_grau: "2º Grau",
  tribunal_superior: "Tribunal Superior"
};

const STATUS_LABELS: Record<string, string> = {
  M: "Marcada",
  F: "Realizada",
  C: "Cancelada"
};

function formatEventDescription(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;

  const parts: string[] = [];

  if (metadata.trt) parts.push(String(metadata.trt));
  if (metadata.grau) {
    const grau = String(metadata.grau);
    parts.push(GRAU_LABELS[grau] ?? grau);
  }
  if (metadata.status) {
    const status = String(metadata.status);
    parts.push(STATUS_LABELS[status] ?? status);
  }
  if (metadata.prazoVencido === true) parts.push("Prazo vencido");

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function adaptUnifiedEvent(e: UnifiedCalendarEvent): CalendarEvent {
  const metadata = e.metadata as Record<string, unknown> | null | undefined;
  return {
    id: e.id,
    title: e.title,
    description: e.source === "agenda"
      ? (metadata?.descricao as string) || undefined
      : formatEventDescription(metadata),
    start: new Date(e.startAt),
    end: new Date(e.endAt),
    allDay: e.allDay,
    color: (e.color as CalendarEvent["color"]) || "sky",
    location: e.source === "agenda" ? (metadata?.local as string) || undefined : undefined,
    source: e.source,
    sourceEntityId: typeof e.sourceEntityId === "number" ? e.sourceEntityId : undefined,
    responsavelId: e.responsavelId,
  };
}

export default function EventCalendarApp({
  initialEvents,
}: {
  initialEvents: UnifiedCalendarEvent[];
}) {
  const router = useRouter();

  const [serverEvents, setServerEvents] = useState<UnifiedCalendarEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);

  // Dialog state for creating/editing agenda events
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);

  // Filter server events by source, then adapt to CalendarEvent
  const filteredServerEvents = useMemo(() => {
    if (sourceFilter.length === 0) return serverEvents;
    return serverEvents.filter((e) => sourceFilter.includes(e.source));
  }, [serverEvents, sourceFilter]);

  const events = useMemo<CalendarEvent[]>(
    () => filteredServerEvents.map(adaptUnifiedEvent),
    [filteredServerEvents]
  );

  const eventUrlById = useMemo(() => {
    return new Map<string, string>(serverEvents.map((e) => [e.id, e.url]));
  }, [serverEvents]);

  // --- Dynamic fetch when month changes ---
  const fetchRangeKey = useMemo(
    () => format(startOfMonth(currentDate), "yyyy-MM"),
    [currentDate]
  );

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Derive range from the key to avoid stale closures
    const [year, month] = fetchRangeKey.split("-").map(Number);
    const center = new Date(year, month - 1, 1);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await actionListarEventosCalendar({
          startAt: rangeStart.toISOString(),
          endAt: rangeEnd.toISOString()
        });
        if (cancelled) return;
        if (result.success) {
          setServerEvents(result.data);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [fetchRangeKey]);

  // Filter events by search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((e) => e.title.toLowerCase().includes(query));
  }, [events, searchQuery]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "month") return subMonths(d, 1);
      if (view === "week") return subWeeks(d, 1);
      if (view === "day") return addDays(d, -1);
      if (view === "agenda") return addDays(d, -AgendaDaysToShow);
      return d;
    });
  }, [view]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "month") return addMonths(d, 1);
      if (view === "week") return addWeeks(d, 1);
      if (view === "day") return addDays(d, 1);
      if (view === "agenda") return addDays(d, AgendaDaysToShow);
      return d;
    });
  }, [view]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  // View title for the navigation bar
  const viewTitle = useMemo(() => {
    const loc = { locale: ptBR };
    const fmt = (d: Date, pattern: string) => capitalizeFirst(format(d, pattern, loc));

    if (view === "month") {
      return fmt(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(start, end)) return fmt(start, "MMMM yyyy");
      return `${fmt(start, "MMM")} - ${fmt(end, "MMM yyyy")}`;
    } else if (view === "day") {
      return fmt(currentDate, "d 'de' MMMM, yyyy");
    } else if (view === "agenda") {
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);
      if (isSameMonth(start, end)) return fmt(start, "MMMM yyyy");
      return `${fmt(start, "MMM")} - ${fmt(end, "MMM yyyy")}`;
    }
    return fmt(currentDate, "MMMM yyyy");
  }, [currentDate, view]);

  // Refetch events for current range
  const refetchEvents = useCallback(async () => {
    const [year, month] = fetchRangeKey.split("-").map(Number);
    const center = new Date(year, month - 1, 1);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));

    setIsLoading(true);
    try {
      const result = await actionListarEventosCalendar({
        startAt: rangeStart.toISOString(),
        endAt: rangeEnd.toISOString()
      });
      if (result.success) {
        setServerEvents(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchRangeKey]);

  const handleEventSelect = (event: CalendarEvent) => {
    if (event.source === "agenda") {
      // Open dialog for editing agenda events
      setSelectedEvent(event);
      setDialogReadOnly(false);
      setDialogOpen(true);
    } else {
      const url = eventUrlById.get(event.id);
      if (url) {
        // Events from other sources: open dialog in read-only mode
        setSelectedEvent(event);
        setDialogReadOnly(true);
        setDialogOpen(true);
      }
    }
  };

  const handleCreateClick = () => {
    setSelectedEvent(null);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleDialogSave = async (event: CalendarEvent) => {
    try {
      if (selectedEvent?.source === "agenda" && selectedEvent.sourceEntityId) {
        // Update existing agenda event
        await actionAtualizarAgendaEvento({
          id: selectedEvent.sourceEntityId,
          titulo: event.title,
          descricao: event.description || null,
          dataInicio: event.start.toISOString(),
          dataFim: event.end.toISOString(),
          diaInteiro: event.allDay || false,
          local: event.location || null,
          cor: event.color || "sky",
          responsavelId: event.responsavelId ?? null,
        });
      } else {
        // Create new agenda event
        await actionCriarAgendaEvento({
          titulo: event.title,
          descricao: event.description || null,
          dataInicio: event.start.toISOString(),
          dataFim: event.end.toISOString(),
          diaInteiro: event.allDay || false,
          local: event.location || null,
          cor: event.color || "sky",
          responsavelId: event.responsavelId ?? null,
        });
      }
      setDialogOpen(false);
      setSelectedEvent(null);
      await refetchEvents();
    } catch {
      // Error is handled by the action (toast/error in ActionResult)
    }
  };

  const handleDialogDelete = async (eventId: string) => {
    // Extract sourceEntityId from the unified event id (format: "agenda:123")
    const parts = eventId.split(":");
    const entityId = Number(parts[1]);
    if (!entityId || Number.isNaN(entityId)) return;

    try {
      await actionDeletarAgendaEvento({ id: entityId });
      setDialogOpen(false);
      setSelectedEvent(null);
      await refetchEvents();
    } catch {
      // Error handled by action
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
  };

  // Navigate to source entity URL
  const handleNavigateToSource = () => {
    if (!selectedEvent) return;
    const url = eventUrlById.get(selectedEvent.id);
    if (url) {
      router.push(url);
      handleDialogClose();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-2rem)] flex-col gap-4">
      {/* Row 1: Title + Create button */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Agenda</h1>
        <Button onClick={handleCreateClick}>
          <PlusIcon size={16} aria-hidden="true" />
          <span className="max-sm:sr-only">Novo evento</span>
        </Button>
      </div>

      {/* Row 2: Search (left) + Navigation controls + View selector (right) */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <SearchIcon
            className="text-muted-foreground/70 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            aria-hidden="true"
          />
          <Input
            className="h-9 bg-card pl-9"
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FilterPopoverMulti
          label="Tipo"
          placeholder="Buscar tipo..."
          options={SOURCE_FILTER_OPTIONS}
          value={sourceFilter}
          onValueChange={setSourceFilter}
        />

        <div className="ml-auto flex items-center gap-1">
          {/* Navigation: [<] Title [>] */}
          <Button
            type="button"
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors p-0"
            variant="ghost"
            onClick={handlePrevious}
            aria-label="Anterior">
            <ChevronLeftIcon size={16} aria-hidden="true" />
          </Button>
          <span className="min-w-30 text-center text-sm font-medium sm:min-w-40">
            {isLoading ? (
              <LoaderCircle className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              viewTitle
            )}
          </span>
          <Button
            type="button"
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors p-0"
            variant="ghost"
            onClick={handleNext}
            aria-label="Próximo">
            <ChevronRightIcon size={16} aria-hidden="true" />
          </Button>

          {/* Hoje */}
          <Button variant="outline" className="h-9 bg-card border shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={handleToday}>
            <CalendarCheck className="sm:hidden" size={16} aria-hidden="true" />
            <span className="max-sm:sr-only">Hoje</span>
          </Button>

          {/* View mode popover */}
          <CalendarViewPopover value={view} onValueChange={setView} />
        </div>
      </div>

      {/* Calendar (no internal toolbar) */}
      <EventCalendar
        events={filteredEvents}
        onEventSelect={handleEventSelect}
        currentDate={currentDate}
        onCurrentDateChange={setCurrentDate}
        view={view}
        onViewChange={setView}
        hideToolbar
      />

      {/* Event Dialog for creating/editing agenda events */}
      <EventDialog
        event={selectedEvent}
        isOpen={dialogOpen}
        readOnly={dialogReadOnly}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
        onNavigateToSource={selectedEvent?.source && selectedEvent.source !== "agenda" ? handleNavigateToSource : undefined}
      />
    </div>
  );
}

/** Calendar-specific view mode popover (matches ViewModePopover pattern but uses CalendarView types) */
function CalendarViewPopover({
  value,
  onValueChange
}: {
  value: CalendarView;
  onValueChange: (value: CalendarView) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentOption = CALENDAR_VIEW_OPTIONS.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 bg-card border shadow-sm hover:bg-accent hover:text-accent-foreground",
                "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              )}
              aria-label="Alterar visualização">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Visualização: {currentOption?.label || "Selecionar"}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-44 p-1">
        <div className="flex flex-col gap-0.5">
          {CALENDAR_VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
                  isSelected && "bg-accent text-accent-foreground"
                )}>
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{option.label}</span>
                <kbd className="text-muted-foreground text-xs">{option.shortcut}</kbd>
                {isSelected && <Check className="text-primary h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
