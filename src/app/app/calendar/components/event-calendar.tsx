"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarCheck, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import {
  addHoursToDate,
  AgendaDaysToShow,
  AgendaView,
  CalendarDndProvider,
  CalendarEvent,
  CalendarView,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView
} from "./";
import { cn } from "@/lib/utils";

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface EventCalendarProps {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventSelect?: (event: CalendarEvent) => void;
  readOnly?: boolean;
  className?: string;
  initialView?: CalendarView;
  /** Controlled current date (if omitted, uses internal state) */
  currentDate?: Date;
  onCurrentDateChange?: (date: Date) => void;
  /** Controlled view mode (if omitted, uses internal state) */
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  /** Hide the internal toolbar (for external toolbar control) */
  hideToolbar?: boolean;
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onEventSelect,
  readOnly = false,
  className,
  initialView = "month",
  currentDate: controlledDate,
  onCurrentDateChange,
  view: controlledView,
  onViewChange,
  hideToolbar = false
}: EventCalendarProps) {
  const [internalDate, setInternalDate] = useState(new Date());
  const [internalView, setInternalView] = useState<CalendarView>(initialView);

  // Controlled/uncontrolled hybrid: use controlled values when provided
  const currentDate = controlledDate ?? internalDate;
  const setCurrentDate = onCurrentDateChange ?? setInternalDate;
  const view = controlledView ?? internalView;
  const setView = onViewChange ?? setInternalView;
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDialogOpen, setView]);

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "agenda") {
      // For agenda view, go back 30 days (a full month)
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "agenda") {
      // For agenda view, go forward 30 days (a full month)
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventSelect = (event: CalendarEvent) => {
    if (onEventSelect) {
      // Parent controls the dialog — delegate entirely
      onEventSelect(event);
      return;
    }
    if (readOnly) return;
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    if (readOnly) return;
    // Snap to 15-minute intervals
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      if (remainder < 7.5) {
        // Round down to nearest 15 min
        startTime.setMinutes(minutes - remainder);
      } else {
        // Round up to nearest 15 min
        startTime.setMinutes(minutes + (15 - remainder));
      }
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: startTime,
      end: addHoursToDate(startTime, 1),
      allDay: false
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (readOnly) {
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      return;
    }
    if (event.id) {
      onEventUpdate?.(event);
      // Show toast notification when an event is updated
      toast(`Evento "${event.title}" atualizado`, {
        description: format(new Date(event.start), "d 'de' MMM, yyyy", { locale: ptBR }),
        position: "bottom-left"
      });
    } else {
      onEventAdd?.({
        ...event,
        id: Math.random().toString(36).substring(2, 11)
      });
      // Show toast notification when an event is added
      toast(`Evento "${event.title}" adicionado`, {
        description: format(new Date(event.start), "d 'de' MMM, yyyy", { locale: ptBR }),
        position: "bottom-left"
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId: string) => {
    if (readOnly) {
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      return;
    }
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);

    // Show toast notification when an event is deleted
    if (deletedEvent) {
      toast(`Evento "${deletedEvent.title}" excluído`, {
        description: format(new Date(deletedEvent.start), "d 'de' MMM, yyyy", { locale: ptBR }),
        position: "bottom-left"
      });
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    if (readOnly) return;
    onEventUpdate?.(updatedEvent);

    // Show toast notification when an event is updated via drag and drop
    toast(`Evento "${updatedEvent.title}" movido`, {
      description: format(new Date(updatedEvent.start), "d 'de' MMM, yyyy", { locale: ptBR }),
      position: "bottom-left"
    });
  };

  const viewTitle = useMemo(() => {
    const loc = { locale: ptBR };
    const fmt = (d: Date, pattern: string) => capitalizeFirst(format(d, pattern, loc));

    if (view === "month") {
      return fmt(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(start, end)) {
        return fmt(start, "MMMM yyyy");
      } else {
        return `${fmt(start, "MMM")} - ${fmt(end, "MMM yyyy")}`;
      }
    } else if (view === "day") {
      return (
        <>
          <span className="xs:hidden" aria-hidden="true">
            {fmt(currentDate, "d 'de' MMM, yyyy")}
          </span>
          <span className="max-[479px]:hidden md:hidden" aria-hidden="true">
            {fmt(currentDate, "d 'de' MMMM, yyyy")}
          </span>
          <span className="max-md:hidden">{fmt(currentDate, "EEEE, d 'de' MMMM 'de' yyyy")}</span>
        </>
      );
    } else if (view === "agenda") {
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);

      if (isSameMonth(start, end)) {
        return fmt(start, "MMMM yyyy");
      } else {
        return `${fmt(start, "MMM")} - ${fmt(end, "MMM yyyy")}`;
      }
    } else {
      return fmt(currentDate, "MMMM yyyy");
    }
  }, [currentDate, view]);

  return (
    <div
      className="bg-card flex min-h-0 flex-1 flex-col rounded-lg border has-data-[slot=month-view]:flex-1"
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`
        } as React.CSSProperties
      }>
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        {!hideToolbar && <div className={cn("flex items-center justify-between p-2 sm:p-4", className)}>
          <div className="flex items-center gap-1 sm:gap-4">
            <Button
              variant="outline"
              className="max-[479px]:aspect-square max-[479px]:p-0!"
              onClick={handleToday}>
              <CalendarCheck className="xs:hidden" size={16} aria-hidden="true" />
              <span className="max-[479px]:sr-only">Hoje</span>
            </Button>
            <div className="flex items-center sm:gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious} aria-label="Anterior">
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext} aria-label="Próximo">
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </div>
            <h2 className="text-sm font-semibold sm:text-lg md:text-xl">{viewTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 max-[479px]:h-8">
                  <span>
                    <span className="xs:hidden" aria-hidden="true">
                      {{ month: "M", week: "S", day: "D", agenda: "A" }[view]}
                    </span>
                    <span className="max-[479px]:sr-only">
                      {{ month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda" }[view]}
                    </span>
                  </span>
                  <ChevronDownIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={() => setView("month")}>
                  Mês <DropdownMenuShortcut>M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("week")}>
                  Semana <DropdownMenuShortcut>W</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("day")}>
                  Dia <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("agenda")}>
                  Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!readOnly && (
              <Button
                className="max-[479px]:aspect-square max-[479px]:p-0!"
                size="sm"
                onClick={() => {
                  setSelectedEvent(null); // Ensure we're creating a new event
                  setIsEventDialogOpen(true);
                }}>
                <PlusIcon className="opacity-60 sm:-ms-1" size={16} aria-hidden="true" />
                <span className="max-sm:sr-only">Novo evento</span>
              </Button>
            )}
          </div>
        </div>}

        <div className="flex flex-1 flex-col">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
        </div>

        {/* Only render internal dialog when no parent controls it */}
        {!onEventSelect && (
          <EventDialog
            event={selectedEvent}
            isOpen={isEventDialogOpen}
            readOnly={readOnly}
            onClose={() => {
              setIsEventDialogOpen(false);
              setSelectedEvent(null);
            }}
            onSave={handleEventSave}
            onDelete={handleEventDelete}
          />
        )}
      </CalendarDndProvider>
    </div>
  );
}
