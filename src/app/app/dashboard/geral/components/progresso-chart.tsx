"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface ProgressoChartProps {
  percentual: number;
}

const chartConfig = {
  progresso: {
    label: "Progresso",
  },
  valor: {
    label: "Valor",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ProgressoChart({ percentual }: ProgressoChartProps) {
  // Calcula o ângulo final baseado no percentual (360° = 100%)
  const endAngle = (percentual / 100) * 360;

  const chartData = [
    { name: "progresso", valor: percentual, fill: "var(--color-valor)" },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square size-full">
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={90 - endAngle}
        innerRadius={25}
        outerRadius={35}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          polarRadius={[30, 25]}
        />
        <RadialBar dataKey="valor" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                      className="fill-foreground text-sm font-bold"
                    >
                      {percentual}%
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
