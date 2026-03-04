import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MembroAtivo, DashboardSummary } from "../../lib/domain";

function TrendIndicator({
  value,
  variacao,
}: {
  value: React.ReactNode;
  variacao: number;
}) {
  const isPositive = variacao >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1">
      <Icon className={cn("size-4", isPositive ? "text-green-600" : "text-red-600")} />
      {value}
    </span>
  );
}

interface SuccessMetricsProps {
  membros: MembroAtivo[];
  resumo: DashboardSummary;
}

export function SuccessMetrics({ membros, resumo }: SuccessMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Membros Ativos</CardDescription>
        <CardTitle className="font-display text-2xl lg:text-3xl">
          {membros.length}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm font-bold">Destaques do Mês</p>
        {membros.length > 0 ? (
          <div className="flex -space-x-4">
            <TooltipProvider>
              {membros.map((membro) => (
                <Tooltip key={membro.usuarioId}>
                  <TooltipTrigger>
                    <Avatar className="border-card size-12 border-4 hover:z-10">
                      <AvatarImage
                        src={membro.avatar ?? ""}
                        alt={membro.nome}
                      />
                      <AvatarFallback>
                        {getInitials(membro.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {membro.nome} — {membro.totalTarefasConcluidas} tarefas
                    concluídas
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum membro ativo.
          </p>
        )}
        <p className="mt-8 mb-2 text-sm font-bold">Resumo</p>
        <div className="divide-y *:py-3">
          <div className="flex justify-between text-sm">
            <span>Projetos Ativos</span>
            <TrendIndicator
              value={resumo.projetosAtivos}
              variacao={resumo.projetosAtivosVariacao}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Taxa de Conclusão</span>
            <TrendIndicator
              value={`${resumo.taxaConclusao}%`}
              variacao={resumo.taxaConclusaoVariacao}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Horas este Mês</span>
            <TrendIndicator
              value={`${resumo.horasRegistradas}h`}
              variacao={resumo.horasRegistradasVariacao}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
