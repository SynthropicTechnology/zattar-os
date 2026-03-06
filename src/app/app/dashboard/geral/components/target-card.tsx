import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { buscarProgressoDiario } from "../../repositories/progresso-diario";
import { ProgressoChart } from "./progresso-chart";

interface TargetCardProps {
  usuarioId: number;
}

export async function TargetCard({ usuarioId }: TargetCardProps) {
  const progresso = await buscarProgressoDiario(usuarioId);

  const mensagem =
    progresso.percentual === 100
      ? "Parabéns! Você completou todas as tarefas do dia!"
      : progresso.percentual >= 75
        ? "Quase lá! Você está no caminho certo."
        : progresso.percentual >= 50
          ? "Bom progresso! Continue assim."
          : progresso.total === 0
            ? "Nenhum evento pendente para hoje."
            : "Você tem pendências para hoje. Vamos lá!";

  const corPercentual =
    progresso.percentual >= 75
      ? "text-green-500"
      : progresso.percentual >= 50
        ? "text-orange-500"
        : "text-orange-500";

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <Target className="size-5" />
          Progresso do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="size-15 shrink-0">
            <ProgressoChart percentual={progresso.percentual} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {mensagem}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className={corPercentual}>{progresso.concluidos}</span> de{" "}
              <span className="font-medium">{progresso.total}</span> itens
              concluídos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
