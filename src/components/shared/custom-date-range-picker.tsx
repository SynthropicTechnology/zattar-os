"use client";

import * as React from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  startOfYear,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-breakpoint";

const dateFilterPresets = [
  { name: "Tudo", value: "all" },
  { name: "Hoje", value: "today" },
  { name: "Ontem", value: "yesterday" },
  { name: "Esta semana", value: "thisWeek" },
  { name: "Últimos 7 dias", value: "last7Days" },
  { name: "Últimos 28 dias", value: "last28Days" },
  { name: "Este mês", value: "thisMonth" },
  { name: "Mês passado", value: "lastMonth" },
  { name: "Este ano", value: "thisYear" },
];

export default function CalendarDateRangePicker({
  className
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getParam = (key: string) => searchParams.get(key) ?? undefined;

  const initialPeriod = getParam("period") ?? "all";
  const initialFrom = getParam("from");
  const initialTo = getParam("to");

  const [period, setPeriod] = React.useState<string>(initialPeriod);
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (initialPeriod === "all") return undefined;
    if (!initialFrom || !initialTo) return undefined;
    const fromD = startOfDay(new Date(initialFrom));
    const toD = endOfDay(new Date(initialTo));
    if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return undefined;
    return { from: fromD, to: toD };
  });
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return date?.from ?? new Date();
  });

  const setUrlParams = React.useCallback(
    (next: { period: string; from?: Date; to?: Date }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", next.period);

      if (next.period === "all") {
        params.delete("from");
        params.delete("to");
      } else if (next.from && next.to) {
        // Persist as YYYY-MM-DD for stable URLs
        params.set("from", format(next.from, "yyyy-MM-dd"));
        params.set("to", format(next.to, "yyyy-MM-dd"));
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleQuickSelect = (from: Date, to: Date) => {
    setDate({ from, to });
    setCurrentMonth(from);
  };

  const changeHandle = (type: string) => {
    const today = new Date();

    switch (type) {
      case "all":
        setPeriod("all");
        setDate(undefined);
        setCurrentMonth(today);
        setUrlParams({ period: "all" });
        break;
      case "today":
        setPeriod("today");
        handleQuickSelect(startOfDay(today), endOfDay(today));
        setUrlParams({ period: "today", from: startOfDay(today), to: endOfDay(today) });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setPeriod("yesterday");
        handleQuickSelect(startOfDay(yesterday), endOfDay(yesterday));
        setUrlParams({ period: "yesterday", from: startOfDay(yesterday), to: endOfDay(yesterday) });
        break;
      case "thisWeek":
        const startOfCurrentWeek = startOfWeek(today);
        setPeriod("thisWeek");
        handleQuickSelect(startOfDay(startOfCurrentWeek), endOfDay(today));
        setUrlParams({ period: "thisWeek", from: startOfDay(startOfCurrentWeek), to: endOfDay(today) });
        break;
      case "last7Days":
        const sevenDaysAgo = subDays(today, 6);
        setPeriod("last7Days");
        handleQuickSelect(startOfDay(sevenDaysAgo), endOfDay(today));
        setUrlParams({ period: "last7Days", from: startOfDay(sevenDaysAgo), to: endOfDay(today) });
        break;
      case "last28Days":
        const twentyEightDaysAgo = subDays(today, 27); // 27 days ago + today = 28 days
        setPeriod("last28Days");
        handleQuickSelect(startOfDay(twentyEightDaysAgo), endOfDay(today));
        setUrlParams({ period: "last28Days", from: startOfDay(twentyEightDaysAgo), to: endOfDay(today) });
        break;
      case "thisMonth":
        setPeriod("thisMonth");
        handleQuickSelect(startOfMonth(today), endOfDay(today));
        setUrlParams({ period: "thisMonth", from: startOfMonth(today), to: endOfDay(today) });
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setPeriod("lastMonth");
        handleQuickSelect(startOfMonth(lastMonth), endOfMonth(lastMonth));
        setUrlParams({ period: "lastMonth", from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "thisYear":
        const startOfCurrentYear = startOfYear(today);
        setPeriod("thisYear");
        handleQuickSelect(startOfDay(startOfCurrentYear), endOfDay(today));
        setUrlParams({ period: "thisYear", from: startOfDay(startOfCurrentYear), to: endOfDay(today) });
        break;
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {isMobile ? (
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      size="icon" aria-label="Selecionar período"
                      className={cn(
                        "bg-card text-muted-foreground hover:bg-muted",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <span className="sr-only">Selecionar período</span>
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy", { locale: ptBR })} - {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "bg-card h-9 justify-start gap-2 px-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}>
              <CalendarIcon className="h-4 w-4" />
              <span className="max-w-55 truncate whitespace-nowrap">
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/yyyy", { locale: ptBR })} - {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>{period === "all" ? "Todos os períodos" : "Selecione o período"}</span>
                )}
              </span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="end">
          <div className="flex flex-col lg:flex-row">
            <div className="me-0 lg:me-4">
              <ToggleGroup
                type="single"
                value={period}
                className="hidden w-28 flex-col lg:block">
                {dateFilterPresets.map((item, key) => (
                  <ToggleGroupItem
                    key={key}
                    className="text-muted-foreground w-full"
                    value={item.value}
                    onClick={() => changeHandle(item.value)}
                    asChild>
                    <Button className="justify-start rounded-md">{item.name}</Button>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Select value={period} onValueChange={(value) => changeHandle(value)}>
                <SelectTrigger
                  className="mb-4 flex w-full lg:hidden"
                  size="sm"
                  aria-label="Selecione um período">
                  <SelectValue placeholder="Tudo" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterPresets.map((item, key) => (
                    <SelectItem key={key} value={item.value}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              className="border-s-0 py-0! ps-0! pe-0! lg:border-s lg:ps-4!"
              mode="range"
              month={currentMonth}
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setPeriod("range");
                if (newDate?.from) setCurrentMonth(newDate.from);
                if (newDate?.from && newDate?.to) {
                  setUrlParams({ period: "range", from: startOfDay(newDate.from), to: endOfDay(newDate.to) });
                }
              }}
              onMonthChange={setCurrentMonth}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
