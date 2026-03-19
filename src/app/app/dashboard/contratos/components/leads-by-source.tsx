"use client";

import * as React from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/shared/CardActionMenus";
import { ClientOnly } from "@/components/shared/client-only";
import { CHART_PALETTE } from "@/components/ui/charts/mini-chart";

// Cores para os gráficos (usando a paleta do projeto)
const COLORS = CHART_PALETTE;

// Função para obter label do estado
function getEstadoLabel(estado: string): string {
  const estadosNomes: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
  };
  return estadosNomes[estado] || estado;
}

interface LeadBySourceCardProps {
  data?: Array<{ estado: string; count: number }>;
  error?: string;
}

export function LeadBySourceCard({ data, error }: LeadBySourceCardProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Calcular chartData antes do early return para usar no useMemo
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => ({
      estado: item.estado,
      label: getEstadoLabel(item.estado),
      clientes: Number(item.count) || 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  const totalClientes = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.clientes, 0);
  }, [chartData]);

  const CHART_WIDTH = 300;
  const CHART_HEIGHT = 250;

  const exportItems = React.useMemo(() => {
    const filenameBase = `clientes-por-estado-${new Date().toISOString().slice(0, 10)}`;

    const downloadText = (filename: string, content: string, mime: string) => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const toCsv = () => {
      const header = ["Estado", "Clientes"];
      const rows = chartData.map((r) => [r.label, String(r.clientes)]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
        .join("\n");
      // BOM p/ Excel
      downloadText(`${filenameBase}.csv`, `\ufeff${csv}\n`, "text/csv;charset=utf-8");
    };

    const toJson = () => {
      downloadText(`${filenameBase}.json`, JSON.stringify(chartData, null, 2), "application/json;charset=utf-8");
    };

    return [
      { label: "Excel (CSV)", onSelect: toCsv },
      { label: "JSON", onSelect: toJson },
    ];
  }, [chartData]);

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Clientes por Estado</CardTitle>
          <CardAction className="relative">
            <ExportButton className="absolute inset-e-0 top-0" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center justify-center h-62.5">
            <p className="text-sm text-muted-foreground">
              {error || 'Nenhum dado disponível'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row justify-between">
        <CardTitle>Clientes por Estado</CardTitle>
        <CardAction className="relative">
          <ExportButton className="absolute inset-e-0 top-0" items={exportItems} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Gráfico de Pizza */}
          <div className="flex items-center justify-center">
            <div style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
              <ClientOnly>
                <PieChart width={CHART_WIDTH} height={CHART_HEIGHT}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0]?.payload as (typeof chartData)[number] | undefined;
                      if (!p) return null;

                      const percent = totalClientes > 0 ? (p.clientes / totalClientes) * 100 : 0;

                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: p.color }}
                            />
                            <div className="text-sm font-medium">{p.label}</div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{p.clientes}</span>{" "}
                            {p.clientes === 1 ? "cliente" : "clientes"}{" "}
                            <span className="text-muted-foreground">({percent.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx={CHART_WIDTH / 2}
                    cy={CHART_HEIGHT / 2}
                    dataKey="clientes"
                    nameKey="estado"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={activeIndex === null || index === activeIndex ? 1 : 0.25}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ClientOnly>
            </div>
          </div>

          {/* Total e Legenda dos estados */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalClientes.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
            </div>

            <div className="flex justify-around flex-wrap gap-4">
              {chartData.map((item, idx) => {
                const percent = totalClientes > 0 ? (item.clientes / totalClientes) * 100 : 0;
                const isActive = activeIndex === null || activeIndex === idx;

                return (
                  <div
                    className={isActive ? "flex flex-col" : "flex flex-col opacity-50"}
                    key={item.estado}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="block size-2 rounded-full"
                        style={{
                          backgroundColor: item.color
                        }}></span>
                      <div className="text-xs tracking-wide uppercase">
                        {item.label}
                      </div>
                    </div>
                    <div className="ms-3.5 text-lg font-semibold">{item.clientes}</div>
                    <div className="ms-3.5 text-xs text-muted-foreground">{percent.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
