"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProjetosPorPeriodo } from "../../lib/domain";

const chartConfig = {
  projetos: { label: "Projetos" },
  criados: { label: "Criados", color: "var(--secondary)" },
  concluidos: { label: "Concluídos", color: "var(--primary)" },
} satisfies ChartConfig;

interface ChartProjectOverviewProps {
  data: ProjetosPorPeriodo[];
}

export function ChartProjectOverview({ data }: ChartProjectOverviewProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("6m");

  React.useEffect(() => {
    if (isMobile) setTimeRange("3m");
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    const meses = timeRange === "12m" ? 12 : timeRange === "6m" ? 6 : 3;
    return data.slice(-meses);
  }, [data, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Visão Geral dos Projetos</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Projetos criados vs concluídos por mês
          </span>
          <span className="@[540px]/card:hidden">Criados vs Concluídos</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="12m">12 meses</ToggleGroupItem>
            <ToggleGroupItem value="6m">6 meses</ToggleGroupItem>
            <ToggleGroupItem value="3m">3 meses</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="6 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="12m" className="rounded-lg">
                12 meses
              </SelectItem>
              <SelectItem value="6m" className="rounded-lg">
                6 meses
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                3 meses
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-50 w-full lg:h-62.5"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCriados" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-criados)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-criados)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillConcluidos" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-concluidos)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-concluidos)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="data"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", { month: "short" });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : filteredData.length - 1}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="concluidos"
              type="natural"
              fill="url(#fillConcluidos)"
              stroke="var(--color-concluidos)"
              stackId="a"
            />
            <Area
              dataKey="criados"
              type="natural"
              fill="url(#fillCriados)"
              stroke="var(--color-criados)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
