"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { ComparativoAnual } from "../../lib/domain";

interface AchievementByYearProps {
  data: ComparativoAnual[];
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
];

export function AchievementByYear({ data }: AchievementByYearProps) {
  if (data.length === 0) {
    return (
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Conclusões por Ano</CardTitle>
          <CardDescription>
            Comparativo de projetos concluídos nos últimos anos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Nenhum dado disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.totalConcluidos), 1);

  return (
    <Card className="xl:col-span-1">
      <CardHeader>
        <CardTitle>Conclusões por Ano</CardTitle>
        <CardDescription>
          Comparativo de projetos concluídos nos últimos anos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {data.map((item, index) => (
          <div key={item.ano} className="grid auto-rows-min gap-2">
            <div className="flex items-baseline gap-1 text-2xl leading-none font-semibold tabular-nums">
              {item.totalConcluidos}
              <span className="text-muted-foreground text-xs font-normal">
                projetos
              </span>
            </div>
            <ChartContainer
              config={{
                steps: {
                  label: "Projetos",
                  color: chartColors[index % chartColors.length],
                },
              }}
              className="aspect-auto h-[32px] w-full"
            >
              <BarChart
                accessibilityLayer
                layout="vertical"
                margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                data={[
                  {
                    date: item.ano.toString(),
                    steps: item.totalConcluidos,
                  },
                ]}
              >
                <Bar
                  dataKey="steps"
                  fill="var(--color-steps)"
                  radius={4}
                  barSize={32}
                >
                  <LabelList
                    position="insideLeft"
                    dataKey="date"
                    offset={8}
                    fontSize={12}
                    fill="var(--primary-foreground)"
                  />
                </Bar>
                <YAxis
                  dataKey="date"
                  type="category"
                  tickCount={1}
                  hide
                />
                <XAxis
                  dataKey="steps"
                  type="number"
                  hide
                  domain={[0, maxValue]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
