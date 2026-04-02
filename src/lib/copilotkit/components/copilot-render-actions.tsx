'use client';

/**
 * CopilotRenderActions
 *
 * Ações frontend com Generative UI — renderizam componentes React
 * inline no chat do Pedrinho. Cada ação `mostrar_*` chama um server action
 * existente e exibe o resultado como card/tabela visual.
 *
 * Complementam (não substituem) os MCP tools backend:
 * - Backend `listar_processos` → retorna JSON (para operações)
 * - Frontend `mostrar_processos` → retorna UI visual (para exibição)
 */

import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scale,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ListTodo,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (iso: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const fmtDataHora = (iso: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

function LoadingCard() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="w-full max-w-md border-destructive/50">
      <CardContent className="p-4">
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}

// ─── Render: Processos ──────────────────────────────────────────────

interface ProcessoRender {
  numeroProcesso?: string;
  classeJudicial?: string;
  descricaoOrgaoJulgador?: string;
  nomeParteAutora?: string;
  nomeParteRe?: string;
  grauAtual?: string;
  trt?: string;
  origem?: string;
}

function ProcessosMiniTable({ processos, total }: { processos: ProcessoRender[]; total: number }) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Processos ({total} encontrados)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-2">
          {processos.slice(0, 5).map((p, i) => (
            <div key={i} className="flex flex-col gap-0.5 border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium">{p.numeroProcesso || '-'}</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  {p.trt || p.grauAtual || '-'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {p.nomeParteAutora || '?'} vs {p.nomeParteRe || '?'}
              </span>
            </div>
          ))}
          {total > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              ... e mais {total - 5} processos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Render: Audiências ─────────────────────────────────────────────

interface AudienciaRender {
  id?: number;
  dataInicio?: string;
  tipo?: string;
  modalidade?: string;
  local?: string;
  numeroProcesso?: string;
  status?: string;
}

function AudienciaCards({ audiencias, total }: { audiencias: AudienciaRender[]; total: number }) {
  const statusColor = (s?: string) => {
    if (!s) return 'secondary';
    if (s === 'marcada') return 'default';
    if (s === 'realizada') return 'secondary';
    if (s === 'cancelada') return 'destructive';
    return 'outline';
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Audiencias ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-2">
          {audiencias.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-medium">{fmtDataHora(a.dataInicio ?? null)}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {a.numeroProcesso || 'Processo N/A'} — {a.tipo || a.modalidade || 'Tipo N/A'}
                </span>
              </div>
              <Badge variant={statusColor(a.status)} className="text-[10px] h-5 shrink-0">
                {a.status || '-'}
              </Badge>
            </div>
          ))}
          {total > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              ... e mais {total - 5} audiencias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Render: DRE ────────────────────────────────────────────────────

interface DRERender {
  receitaBruta: number;
  receitaLiquida: number;
  lucroBruto: number;
  margemBruta: number;
  lucroOperacional: number;
  ebitda: number;
  margemEBITDA: number;
  lucroLiquido: number;
  margemLiquida: number;
}

function DRESummaryCard({ dre, periodo }: { dre: DRERender; periodo: string }) {
  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const rows = [
    { label: 'Receita Bruta', value: dre.receitaBruta },
    { label: 'Receita Liquida', value: dre.receitaLiquida },
    { label: 'Lucro Bruto', value: dre.lucroBruto, margem: dre.margemBruta },
    { label: 'Lucro Operacional', value: dre.lucroOperacional },
    { label: 'EBITDA', value: dre.ebitda, margem: dre.margemEBITDA },
    { label: 'Lucro Liquido', value: dre.lucroLiquido, margem: dre.margemLiquida, bold: true },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          DRE — {periodo}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1">
          {rows.map((r, i) => (
            <div key={i} className={`flex items-center justify-between py-0.5 ${r.bold ? 'border-t border-border pt-1.5 mt-1' : ''}`}>
              <span className={`text-xs ${r.bold ? 'font-semibold' : 'text-muted-foreground'}`}>
                {r.label}
              </span>
              <div className="flex items-center gap-1.5">
                <TrendIcon value={r.value} />
                <span className={`text-xs tabular-nums ${r.bold ? 'font-semibold' : ''} ${r.value < 0 ? 'text-red-500' : ''}`}>
                  {fmtMoeda(r.value)}
                </span>
                {r.margem !== undefined && (
                  <span className="text-[10px] text-muted-foreground">({r.margem.toFixed(1)}%)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Render: Tarefas ────────────────────────────────────────────────

interface TarefaRender {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
}

function TarefasList({ tarefas, total }: { tarefas: TarefaRender[]; total: number }) {
  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    if (s === 'in progress') return <Clock className="h-3.5 w-3.5 text-blue-500" />;
    if (s === 'canceled') return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
    return <ListTodo className="h-3.5 w-3.5 text-orange-500" />;
  };

  const priorityColor = (p: string) => {
    if (p === 'high' || p === 'urgent') return 'destructive';
    if (p === 'medium') return 'default';
    return 'secondary';
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          Tarefas ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1.5">
          {tarefas.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-0.5">
              {statusIcon(t.status)}
              <span className={`text-xs flex-1 truncate ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {t.title}
              </span>
              <Badge variant={priorityColor(t.priority)} className="text-[10px] h-4">
                {t.priority}
              </Badge>
              {t.dueDate && (
                <span className="text-[10px] text-muted-foreground shrink-0">{fmtData(t.dueDate)}</span>
              )}
            </div>
          ))}
          {total > 8 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              ... e mais {total - 8} tarefas
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hook: Registrar todas as Render Actions ────────────────────────

/**
 * Helper: parseia o result string do v2 para objeto
 */
function parseResult(result: string | undefined): Record<string, unknown> | null {
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

export function useCopilotRenderActions() {
  // ── mostrar_processos ──
  useFrontendTool({
    name: 'mostrar_processos',
    description: 'Mostra uma tabela visual resumida dos processos. Use quando o usuário pedir para VER ou MOSTRAR processos.',
    parameters: z.object({
      busca: z.string().optional().describe('Filtro de busca por número ou partes'),
      trt: z.string().optional().describe('Filtrar por TRT (ex: TRT15)'),
      limite: z.number().optional().describe('Limite de resultados (padrão 5)'),
    }),
    render: ({ status, result }) => {
      if (status === 'inProgress') return <LoadingCard />;
      if (status === 'complete') {
        const data = parseResult(result);
        if (data?.processos) return <ProcessosMiniTable processos={data.processos as ProcessoRender[]} total={data.total as number} />;
        if (data?.error) return <ErrorCard message={data.error as string} />;
      }
      return <></>;
    },
    handler: async ({ busca, trt, limite }) => {
      try {
        const { actionListarProcessos } = await import('@/app/app/processos/actions');
        const result = await actionListarProcessos({
          busca: busca || undefined,
          trt: trt || undefined,
          limite: limite || 5,
          pagina: 1,
        });
        if (result?.success && result.data) {
          const data = result.data as { data: ProcessoRender[]; pagination: { total: number } };
          return { processos: data.data, total: data.pagination.total };
        }
        return { error: 'Não foi possível carregar processos', processos: [], total: 0 };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Erro ao buscar processos', processos: [], total: 0 };
      }
    },
  });

  // ── mostrar_audiencias ──
  useFrontendTool({
    name: 'mostrar_audiencias',
    description: 'Mostra cards visuais das próximas audiências. Use quando o usuário pedir para VER ou MOSTRAR audiências.',
    parameters: z.object({
      status: z.string().optional().describe('Filtrar por status (marcada, realizada, cancelada, adiada)'),
      limite: z.number().optional().describe('Limite de resultados (padrão 5)'),
    }),
    render: ({ status, result }) => {
      if (status === 'inProgress') return <LoadingCard />;
      if (status === 'complete') {
        const data = parseResult(result);
        if (data?.audiencias) return <AudienciaCards audiencias={data.audiencias as AudienciaRender[]} total={data.total as number} />;
        if (data?.error) return <ErrorCard message={data.error as string} />;
      }
      return <></>;
    },
    handler: async ({ status: statusFilter, limite }) => {
      try {
        const { actionListarAudiencias } = await import('@/app/app/audiencias/actions');
        const result = await actionListarAudiencias({
          limite: limite || 5,
          pagina: 1,
          status: statusFilter as unknown as undefined,
          ordenarPor: 'dataInicio' as const,
          ordem: 'asc',
        });
        if (result?.success && result.data) {
          const data = result.data as { data: AudienciaRender[]; pagination: { total: number } };
          return { audiencias: data.data, total: data.pagination.total };
        }
        return { error: 'Não foi possível carregar audiências', audiencias: [], total: 0 };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Erro ao buscar audiências', audiencias: [], total: 0 };
      }
    },
  });

  // ── mostrar_resumo_dre ──
  useFrontendTool({
    name: 'mostrar_resumo_dre',
    description: 'Mostra um card visual com o resumo do DRE (Demonstração de Resultado do Exercício). Use quando o usuário pedir para VER o DRE ou resultado financeiro.',
    parameters: z.object({
      periodo: z.string().optional().describe('Tipo de período: mensal, trimestral, semestral, anual (padrão: mensal)'),
    }),
    render: ({ status, result }) => {
      if (status === 'inProgress') return <LoadingCard />;
      if (status === 'complete') {
        const data = parseResult(result);
        if (data?.dre) return <DRESummaryCard dre={data.dre as DRERender} periodo={data.periodoLabel as string} />;
        if (data?.error) return <ErrorCard message={data.error as string} />;
      }
      return <></>;
    },
    handler: async ({ periodo }) => {
      try {
        const { gerarPeriodoAtual } = await import('@/app/app/financeiro');
        const { actionGerarDRE } = await import('@/app/app/financeiro/actions/dre');
        const tipo = (periodo || 'mensal') as 'mensal' | 'trimestral' | 'semestral' | 'anual';
        const { dataInicio, dataFim } = gerarPeriodoAtual(tipo);
        const result = await actionGerarDRE({ dataInicio, dataFim, tipo });
        if (result?.success && result.data) {
          const resumo = (result.data as { dre: { resumo: DRERender }; geradoEm: string }).dre.resumo;
          return {
            dre: resumo,
            periodoLabel: `${new Date(dataInicio).toLocaleDateString('pt-BR')} — ${new Date(dataFim).toLocaleDateString('pt-BR')}`,
          };
        }
        return { error: 'Não foi possível gerar o DRE' };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Erro ao gerar DRE' };
      }
    },
  });

  // ── mostrar_tarefas ──
  useFrontendTool({
    name: 'mostrar_tarefas',
    description: 'Mostra uma lista visual das tarefas do usuário. Use quando o usuário pedir para VER ou MOSTRAR tarefas.',
    parameters: z.object({
      status: z.string().optional().describe('Filtrar por status: backlog, todo, in progress, done, canceled'),
      limite: z.number().optional().describe('Limite de resultados (padrão 8)'),
    }),
    render: ({ status, result }) => {
      if (status === 'inProgress') return <LoadingCard />;
      if (status === 'complete') {
        const data = parseResult(result);
        if (data?.tarefas) return <TarefasList tarefas={data.tarefas as TarefaRender[]} total={data.total as number} />;
        if (data?.error) return <ErrorCard message={data.error as string} />;
      }
      return <></>;
    },
    handler: async ({ status: statusFilter, limite }) => {
      try {
        const { actionListarTarefas } = await import('@/app/app/tarefas/actions/tarefas-actions');
        const result = await actionListarTarefas({
          limit: limite || 8,
          status: statusFilter as 'backlog' | 'todo' | 'in progress' | 'done' | 'canceled' | undefined,
        });
        if (result?.success && result.data) {
          const tarefas = result.data as TarefaRender[];
          return { tarefas, total: tarefas.length };
        }
        return { error: 'Não foi possível carregar tarefas', tarefas: [], total: 0 };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Erro ao buscar tarefas', tarefas: [], total: 0 };
      }
    },
  });
}
