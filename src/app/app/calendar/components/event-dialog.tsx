"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ExternalLink, Trash2 } from "lucide-react";
import { format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import type { CalendarEvent, EventColor } from "./";
import { DefaultEndHour, DefaultStartHour, EndHour, StartHour } from "../constants";
import { useUsuarios } from "@/features/usuarios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onNavigateToSource?: () => void;
}

export function EventDialog({ event, isOpen, readOnly = false, onClose, onSave, onDelete, onNavigateToSource }: EventDialogProps) {
  // Fetch users for the responsável selector (only when dialog is open)
  const { usuarios, isLoading: isLoadingUsuarios } = useUsuarios({ ativo: true, enabled: isOpen && !readOnly });

  // Helper functions
  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  // Calculate initial form state based on event prop
  const getInitialFormState = useCallback(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return {
        title: event.title || "",
        description: event.description || "",
        startDate: start,
        endDate: end,
        startTime: formatTimeForInput(start),
        endTime: formatTimeForInput(end),
        allDay: event.allDay || false,
        location: event.location || "",
        color: (event.color as EventColor) || "sky",
        responsavelId: event.responsavelId ?? null,
      };
    }
    return {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: `${DefaultStartHour}:00`,
      endTime: `${DefaultEndHour}:00`,
      allDay: false,
      location: "",
      color: "sky" as EventColor,
      responsavelId: null as number | null,
    };
  }, [event, formatTimeForInput]);

  // Get initial form state based on event prop
  const initialState = useMemo(() => getInitialFormState(), [getInitialFormState]);

  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState(initialState.description);
  const [startDate, setStartDate] = useState<Date>(initialState.startDate);
  const [endDate, setEndDate] = useState<Date>(initialState.endDate);
  const [startTime, setStartTime] = useState(initialState.startTime);
  const [endTime, setEndTime] = useState(initialState.endTime);
  const [allDay, setAllDay] = useState(initialState.allDay);
  const [location, setLocation] = useState(initialState.location);
  const [color, setColor] = useState<EventColor>(initialState.color);
  const [responsavelId, setResponsavelId] = useState<number | null>(initialState.responsavelId);
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Sync form state when event prop changes (fixes stale state on event switch)
  useEffect(() => {
    const state = getInitialFormState();
    setTitle(state.title);
    setDescription(state.description);
    setStartDate(state.startDate);
    setEndDate(state.endDate);
    setStartTime(state.startTime);
    setEndTime(state.endTime);
    setAllDay(state.allDay);
    setLocation(state.location);
    setColor(state.color);
    setResponsavelId(state.responsavelId);
    setError(null);
  }, [getInitialFormState]);

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "HH:mm", { locale: ptBR });
        options.push({ value, label });
      }
    }
    return options;
  }, []); // Empty dependency array ensures this only runs once

  const handleSave = () => {
    if (readOnly) {
      onClose();
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime.split(":").map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(`O hor\u00e1rio selecionado deve estar entre ${StartHour}:00 e ${EndHour}:00`);
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError("A data de t\u00e9rmino n\u00e3o pode ser anterior \u00e0 data de in\u00edcio");
      return;
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(sem t\u00edtulo)";

    onSave({
      id: event?.id || "",
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color,
      source: event?.source || "agenda",
      sourceEntityId: event?.sourceEntityId,
      responsavelId,
    });
  };

  const handleDelete = () => {
    if (readOnly) {
      onClose();
      return;
    }
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // Updated color options to match types.ts
  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: "sky",
      label: "Azul",
      bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
      borderClass: "border-sky-400 data-[state=checked]:border-sky-400"
    },
    {
      value: "amber",
      label: "\u00c2mbar",
      bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
      borderClass: "border-amber-400 data-[state=checked]:border-amber-400"
    },
    {
      value: "violet",
      label: "Violeta",
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400"
    },
    {
      value: "rose",
      label: "Rosa",
      bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
      borderClass: "border-rose-400 data-[state=checked]:border-rose-400"
    },
    {
      value: "emerald",
      label: "Verde",
      bgClass: "bg-green-400 data-[state=checked]:bg-green-400",
      borderClass: "border-green-400 data-[state=checked]:border-green-400"
    },
    {
      value: "orange",
      label: "Laranja",
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? "Detalhes do Evento" : event?.id ? "Editar Evento" : "Criar Evento"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {readOnly
              ? "Visualize os detalhes deste evento"
              : event?.id
                ? "Edite os detalhes deste evento"
                : "Adicione um novo evento à sua agenda"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">T\u00edtulo</Label>
            <Input
              id="title"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Descri\u00e7\u00e3o</Label>
            <Textarea
              id="description"
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date">Data de In\u00edcio</Label>
              <Popover
                open={readOnly ? false : startDateOpen}
                onOpenChange={(open) => {
                  if (readOnly) return;
                  setStartDateOpen(open);
                }}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    disabled={readOnly}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground"
                    )}>
                    <span className={cn("truncate", !startDate && "text-muted-foreground")}>
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </span>
                    <CalendarIcon
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    onSelect={(date) => {
                      if (readOnly) return;
                      if (date) {
                        setStartDate(date);
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setError(null);
                        setStartDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time">Hora de In\u00edcio</Label>
                <Select disabled={readOnly} value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">Data de T\u00e9rmino</Label>
              <Popover
                open={readOnly ? false : endDateOpen}
                onOpenChange={(open) => {
                  if (readOnly) return;
                  setEndDateOpen(open);
                }}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    disabled={readOnly}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground"
                    )}>
                    <span className={cn("truncate", !endDate && "text-muted-foreground")}>
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </span>
                    <CalendarIcon
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (readOnly) return;
                      if (date) {
                        setEndDate(date);
                        setError(null);
                        setEndDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">Hora de T\u00e9rmino</Label>
                <Select disabled={readOnly} value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              disabled={readOnly}
              onCheckedChange={(checked) => {
                if (readOnly) return;
                setAllDay(checked === true);
              }}
            />
            <Label htmlFor="all-day">Dia inteiro</Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={location}
              disabled={readOnly}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          {!readOnly && (
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="responsavel">Responsável</Label>
              <Select
                value={responsavelId ? String(responsavelId) : "none"}
                onValueChange={(value) => setResponsavelId(value === "none" ? null : Number(value))}
                disabled={isLoadingUsuarios}
              >
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder={isLoadingUsuarios ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nomeExibicao || u.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">Cor</legend>
            <RadioGroup
              className="flex gap-1.5"
              disabled={readOnly}
              defaultValue={colorOptions[0]?.value}
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}>
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn("size-6 shadow-none", colorOption.bgClass, colorOption.borderClass)}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {!readOnly && event?.id && (
            <Button variant="outline" size="icon" onClick={handleDelete} aria-label="Excluir evento">
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            {readOnly && onNavigateToSource && (
              <Button variant="outline" onClick={onNavigateToSource}>
                <ExternalLink size={16} aria-hidden="true" />
                Abrir
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {readOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!readOnly && <Button onClick={handleSave}>Salvar</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
