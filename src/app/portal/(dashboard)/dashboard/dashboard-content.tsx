"use client";

import type { DashboardData } from "@/app/portal/feature";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Scale,
  FileText,
  Calendar,
  Wallet,
  AlertCircle,
  Clock,
} from "lucide-react";

interface DashboardContentProps {
  data: DashboardData | null;
  error?: string;
}

export function DashboardContent({ data, error }: DashboardContentProps) {
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">
          {error ?? "Nenhum dado disponivel"}
        </p>
        <p className="text-sm text-muted-foreground">
          Tente recarregar a pagina ou entre em contato com o escritorio.
        </p>
      </div>
    );
  }

  const { processos, contratos, audiencias, pagamentos } = data;

  // Upcoming audiencias (status "M" = Marcada, future date)
  const now = new Date();
  const audienciasFuturas = audiencias
    .filter((a) => a.status === "M" && new Date(a.dataInicio) > now)
    .sort(
      (a, b) =>
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
    );
  const proximaAudiencia = audienciasFuturas[0] ?? null;

  // Pagamentos pendentes
  const pagamentosPendentes = pagamentos.filter(
    (p) => p.status === "pendente" || p.status === "atrasado"
  );

  // Most recent processos (by ultima_movimentacao date, fallback to end of list)
  const processosRecentes = [...processos]
    .sort((a, b) => {
      const dateA = a.ultima_movimentacao?.data ?? "";
      const dateB = b.ultima_movimentacao?.data ?? "";
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo, {data.cliente.nome}
        </p>
      </div>

      {/* Partial errors banner */}
      {data.errors && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          Alguns dados nao puderam ser carregados. As informacoes podem estar
          incompletas.
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Scale className="h-5 w-5" />}
          label="Processos"
          value={processos.length}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Contratos"
          value={contratos.length}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Audiencias Futuras"
          value={audienciasFuturas.length}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Pagamentos Pendentes"
          value={pagamentosPendentes.length}
        />
      </div>

      {/* Proxima Audiencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proxima Audiencia</CardTitle>
          <CardDescription>
            {proximaAudiencia
              ? "Detalhes da sua proxima audiencia agendada"
              : "Nenhuma audiencia futura agendada"}
          </CardDescription>
        </CardHeader>
        {proximaAudiencia && (
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {formatMonth(proximaAudiencia.dataInicio)}
                </span>
                <span className="text-xl font-bold leading-none text-foreground">
                  {formatDay(proximaAudiencia.dataInicio)}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-foreground">
                  {proximaAudiencia.tipoDescricao ?? "Audiencia"}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {proximaAudiencia.horaInicio && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {proximaAudiencia.horaInicio}
                    </span>
                  )}
                  {proximaAudiencia.modalidade && (
                    <span className="capitalize">
                      {proximaAudiencia.modalidade}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processo: {proximaAudiencia.numeroProcesso}
                </p>
                {daysUntil(proximaAudiencia.dataInicio) !== null && (
                  <p className="text-xs font-medium text-primary">
                    Em {daysUntil(proximaAudiencia.dataInicio)} dia
                    {daysUntil(proximaAudiencia.dataInicio)! > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Processos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processos Recentes</CardTitle>
          <CardDescription>
            {processosRecentes.length > 0
              ? "Seus processos com atividade mais recente"
              : "Nenhum processo encontrado"}
          </CardDescription>
        </CardHeader>
        {processosRecentes.length > 0 && (
          <CardContent>
            <div className="divide-y divide-border">
              {processosRecentes.map((processo) => (
                <div
                  key={processo.numero}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-foreground truncate">
                      {processo.numero}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {processo.tipo} &mdash; {processo.parte_contraria}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {processo.tribunal} &middot; {processo.papel_cliente}
                    </p>
                  </div>
                  {processo.ultima_movimentacao && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateBR(processo.ultima_movimentacao.data)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {processo.ultima_movimentacao.evento}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card (local, simple)
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonth(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  } catch {
    return "";
  }
}

function formatDay(isoDate: string): string {
  try {
    return String(new Date(isoDate).getDate());
  } catch {
    return "";
  }
}

function daysUntil(isoDate: string): number | null {
  try {
    const target = new Date(isoDate);
    const now = new Date();
    const diff = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : null;
  } catch {
    return null;
  }
}

function formatDateBR(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}
