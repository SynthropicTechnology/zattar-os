"use client";

import { useTransition } from "react";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import { PRIORIDADE_LABELS, type Lembrete } from "../../lib/domain";
import { actionConcluirLembrete } from "../../lib/actions";
import { AddReminderDialog } from "./add-reminder-dialog";

interface RemindersProps {
  lembretes: Lembrete[];
}

const PRIORIDADE_DOT_COLORS: Record<string, string> = {
  baixa: "bg-gray-400",
  media: "bg-warning",
  alta: "bg-destructive",
  urgente: "bg-destructive",
};

function ReminderCard({ lembrete }: { lembrete: Lembrete }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await actionConcluirLembrete(lembrete.id, !lembrete.concluido);
    });
  };

  const dataFormatada = new Date(lembrete.dataHora).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-semibold capitalize">
          <span
            className={cn(
              "me-2 inline-block size-2 rounded-full",
              PRIORIDADE_DOT_COLORS[lembrete.prioridade] ?? "bg-gray-400"
            )}
          />
          {PRIORIDADE_LABELS[lembrete.prioridade]}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="ms-auto me-2"
          >
            <CircleCheck
              className={cn(
                "size-4",
                lembrete.concluido ? "text-success" : "text-gray-400"
              )}
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">{dataFormatada}</div>
        <div className="text-sm">{lembrete.texto}</div>
        {lembrete.projetoNome && (
          <Badge variant="outline">{lembrete.projetoNome}</Badge>
        )}
        {lembrete.tarefaTitulo && (
          <Badge variant="outline">{lembrete.tarefaTitulo}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function Reminders({ lembretes }: RemindersProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Lembretes</CardTitle>
        <CardAction>
          <AddReminderDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        {lembretes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum lembrete pendente.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lembretes.map((lembrete) => (
              <ReminderCard key={lembrete.id} lembrete={lembrete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
