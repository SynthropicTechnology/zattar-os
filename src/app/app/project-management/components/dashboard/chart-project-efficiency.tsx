"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
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
  ChartStyle,
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
import {
  STATUS_PROJETO_LABELS,
  type DistribuicaoPorStatus,
} from "../../lib/domain";

interface ChartProjectEfficiencyProps {
  data: DistribuicaoPorStatus[];
}

export function ChartProjectEfficiency({
  data,
}: ChartProjectEfficiencyProps) {
  const id = "pie-status-distribuicao";

  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = { total: { label: "Total" } };
    for (const item of data) {
      config[item.status] = {
        label: STATUS_PROJETO_LABELS[item.status],
        color: item.fill,
      };
    }
    return config;
  }, [data]);

  const [activeStatus, setActiveStatus] = React.useState<string>(
    data[0]?.status ?? "ativo"
  );

  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.status === activeStatus),
    [data, activeStatus]
  );

  const totalProjetos = React.useMemo(
    () => data.reduce((acc, item) => acc + item.total, 0),
    [data]
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>Distribuição por Status</CardDescription>
          <CardTitle className="font-display text-xl">
            Eficiência dos Projetos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Nenhum dado disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-chart={id}>
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader>
        <CardDescription>Distribuição por Status</CardDescription>
        <CardTitle className="font-display text-xl">
          Eficiência dos Projetos
        </CardTitle>
        <CardAction>
          <Select value={activeStatus} onValueChange={setActiveStatus}>
            <SelectTrigger
              className="ml-auto"
              aria-label="Selecionar status"
            >
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent align="end">
              {data.map((item) => {
                const config = chartConfig[item.status];
                const color =
                  config && "color" in config ? config.color : undefined;
                return (
                  <SelectItem key={item.status} value={item.status}>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      {STATUS_PROJETO_LABELS[item.status]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-57.5"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data as unknown as Record<string, unknown>[]}
              dataKey="total"
              nameKey="status"
              innerRadius={45}
              strokeWidth={5}
              // @ts-expect-error activeIndex still works at runtime in recharts 3.x
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 5} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 20}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {activeIndex >= 0
                            ? data[activeIndex].total.toLocaleString()
                            : totalProjetos.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Projetos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
