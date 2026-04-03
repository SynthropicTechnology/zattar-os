import { FileText } from "lucide-react";
import { Card, CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { actionContarContratosComEstatisticas } from "@/app/(authenticated)/contratos";
import type { CrmDateFilter } from "../crm-date-filter";
import { toCrmDateFilterInput } from "../crm-date-filter";

export async function TotalContractsCard({ dateFilter }: { dateFilter: CrmDateFilter }) {
  const result = await actionContarContratosComEstatisticas(toCrmDateFilterInput(dateFilter));

  const total = result.success ? result.data.total : 0;
  const variacao = result.success ? result.data.variacaoPercentual : null;
  const comparacaoLabel = result.success ? result.data.comparacaoLabel : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Total de Contratos</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">{total.toLocaleString("pt-BR")}</h4>
          {variacao !== null && (
            <div className="text-muted-foreground text-sm">
              <span className={variacao >= 0 ? "text-success" : "text-destructive"}>
                {variacao >= 0 ? "+" : ""}
                {variacao.toFixed(1)}%
              </span>{" "}
              {comparacaoLabel || "em relação ao mês anterior"}
            </div>
          )}
          {!result.success && (
            <div className="text-muted-foreground text-sm">
              <span className="text-destructive">Erro ao carregar</span>
            </div>
          )}
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <FileText className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}


