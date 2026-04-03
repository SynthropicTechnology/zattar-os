import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { actionContarContratosPorStatus, STATUS_CONTRATO_LABELS, type StatusContrato } from "@/app/(authenticated)/contratos";
import type { CrmDateFilter } from "../crm-date-filter";
import { toCrmDateFilterInput } from "../crm-date-filter";

type PipelineStage = {
  id: StatusContrato;
  name: string;
  count: number;
  color: string;
};

// Mapeamento de status para cores de chart
const STATUS_CHART_COLORS: Record<StatusContrato, string> = {
  em_contratacao: "bg-[var(--chart-1)]",
  contratado: "bg-[var(--chart-2)]",
  distribuido: "bg-[var(--chart-3)]",
  desistencia: "bg-[var(--chart-4)]",
};

// Ordem de exibição dos estágios
const STATUS_ORDER: StatusContrato[] = [
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
];

export async function SalesPipeline({ dateFilter }: { dateFilter: CrmDateFilter }) {
  const result = await actionContarContratosPorStatus(toCrmDateFilterInput(dateFilter));

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Contratos</CardTitle>
          <CardDescription>Contratos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados: {result.error || result.message || 'Erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Contratos</CardTitle>
          <CardDescription>Contratos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const contadores = result.data;

  // Criar array de estágios ordenados
  const pipelineData: PipelineStage[] = STATUS_ORDER.map((status) => ({
    id: status,
    name: STATUS_CONTRATO_LABELS[status],
    count: contadores[status] || 0,
    color: STATUS_CHART_COLORS[status],
  }));

  const totalCount = pipelineData.reduce((sum, stage) => sum + stage.count, 0);

  // Se não houver contratos, mostrar mensagem
  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Contratos</CardTitle>
          <CardDescription>Contratos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum contrato encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline de Contratos</CardTitle>
        <CardDescription>Contratos por estágio</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full">
            {pipelineData.map((stage) => {
              const percentage = totalCount > 0 ? (stage.count / totalCount) * 100 : 0;
              return (
                <Tooltip key={stage.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`${stage.color} h-full`}
                      style={{ width: `${percentage}%` }}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {stage.count} {stage.count === 1 ? 'contrato' : 'contratos'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="space-y-4">
          {pipelineData.map((stage) => {
            const percentage = totalCount > 0 ? (stage.count / totalCount) * 100 : 0;
            return (
              <div key={stage.id} className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${stage.color}`}></div>
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{stage.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {stage.count} {stage.count === 1 ? 'contrato' : 'contratos'}
                    </p>
                  </div>
                  <div className="flex w-24 items-center gap-2">
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorColor={stage.color}
                    />
                    <span className="text-muted-foreground w-10 text-right text-xs">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
