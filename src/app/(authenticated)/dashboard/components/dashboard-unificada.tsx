'use client';

import { useMemo } from 'react';
import {
  Scale,
  Calendar,
  FileText,
  Wallet,

  Users,
  FileWarning,
  ArrowDownLeft,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { useAgentContext } from '@copilotkit/react-core/v2';
import Link from 'next/link';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { useDashboard, useWidgetPermissions } from '../hooks';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
  DashboardData,
  Lembrete,
} from '../domain';
import type { ProgressoDiario } from '../repositories/progresso-diario';
import type { Task } from '@/app/(authenticated)/tarefas/domain';

import {
  WidgetFluxoCaixa,
  WidgetDespesasCategoria,
  WidgetProcessosResumo,
  WidgetAudienciasProximas,
  WidgetExpedientesUrgentes,
  WidgetProdutividade,
} from './widgets';
import { ObrigacoesRecentesCard } from './shared/obrigacoes-recentes-card';
import { ProgressoChart } from '../geral/components/progresso-chart';
import { TarefasWidget } from './dashboard-tarefas';
import { LembretesWidget } from './dashboard-lembretes';
import { ChatWidget } from './dashboard-chat';
import { AdminWidgets } from './dashboard-admin';
import { Heading } from '@/components/ui/typography';

// ============================================================================
// Types
// ============================================================================

interface DashboardUnificadaProps {
  currentUserId: number;
  currentUserName: string;
  initialProgresso: ProgressoDiario;
  initialLembretes: Lembrete[];
  initialTarefas: Task[];
}

// ============================================================================
// Helpers
// ============================================================================

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

// ============================================================================
// KPI Card — exact same pattern as contratos dashboard
// ============================================================================

interface KpiProps {
  label: string;
  value: string;
  description?: string;
  trend?: { value: number; label?: string };
  icon: LucideIcon;
  href?: string;
}

function Kpi({ label, value, description, trend, icon: Icon, href }: KpiProps) {
  const inner = (
    <GlassPanel depth={2} className={cn(
      'transition-all duration-200',
      href && 'hover:bg-transparent cursor-pointer',
    )}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">{value}</h4>
          {trend && (
            <div className="text-muted-foreground text-sm">
              <span className={trend.value >= 0 ? 'text-success' : 'text-destructive'}>
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>{' '}
              {trend.label || 'em relação ao mês anterior'}
            </div>
          )}
          {description && !trend && (
            <div className="text-muted-foreground text-sm">{description}</div>
          )}
        </div>
        <CardAction>
          <div className="flex size-12 items-center justify-center rounded-full border border-border/30 bg-white/5 backdrop-blur-sm">
            <Icon className="size-5 text-foreground/70" />
          </div>
        </CardAction>
      </CardHeader>
    </GlassPanel>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

// ============================================================================
// Progress Card — same Card/CardHeader pattern with radial chart as icon
// ============================================================================

function ProgressKpi({ progresso }: { progresso: ProgressoDiario }) {
  const desc =
    progresso.percentual === 100
      ? 'Tudo concluído!'
      : progresso.total === 0
        ? 'Sem pendências hoje'
        : `${progresso.concluidos} de ${progresso.total} concluídos`;

  return (
    <GlassPanel depth={2} className="transition-all duration-200">
      <CardHeader>
        <CardDescription>Progresso do Dia</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">{progresso.percentual}%</h4>
          <div className="text-muted-foreground text-sm">{desc}</div>
        </div>
        <CardAction>
          <div className="size-12">
            <ProgressoChart percentual={progresso.percentual} />
          </div>
        </CardAction>
      </CardHeader>
    </GlassPanel>
  );
}

// ============================================================================
// Loading
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassPanel key={i} depth={2}>
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
              <CardAction>
                <Skeleton className="size-12 rounded-full" />
              </CardAction>
            </CardHeader>
          </GlassPanel>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-80 rounded-xl" />
        <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// Error / No Permissions
// ============================================================================

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-5 mb-5">
        <FileWarning className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
      <button onClick={onRetry} className="text-sm text-primary hover:underline cursor-pointer">Tentar novamente</button>
    </div>
  );
}

function SemPermissoes({ nome }: { nome: string }) {
  return (
    <div className="space-y-4">
      <Heading level="page">{getSaudacao()}, {nome}!</Heading>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-5 mb-5">
          <FileWarning className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Sem permissões</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Você não possui permissões para visualizar dados do dashboard. Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// User Dashboard
// ============================================================================

interface ContentProps {
  data: DashboardData;
  progresso: ProgressoDiario;
  lembretes: Lembrete[];
  tarefas: Task[];
  currentUserId: number;
  currentUserName: string;
}

function UserContent({ data, progresso, lembretes, tarefas, currentUserId, currentUserName }: ContentProps) {
  const d = data as DashboardUsuarioData;
  const {
    podeVerProcessos,
    podeVerAudiencias,
    podeVerExpedientes,
    podeVerFinanceiro,
    temAlgumaPermissao,
    isLoading,
  } = useWidgetPermissions();

  if (isLoading) return <DashboardSkeleton />;
  if (!temAlgumaPermissao) return <SemPermissoes nome={d.usuario.nome} />;

  return (
    <div className="space-y-4">
      <Heading level="page">
        {getSaudacao()}, {d.usuario.nome}!
      </Heading>

      {/* KPI Cards — mesmo padrão visual de contratos */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressKpi progresso={progresso} />

        {podeVerProcessos && (
          <Kpi
            label="Processos"
            value={fmtNum(d.processos.total)}
            description={`${fmtNum(d.processos.ativos)} ativos`}
            icon={Scale}
            href="/app/processos"
          />
        )}
        {podeVerAudiencias && (
          <Kpi
            label="Audiências"
            value={fmtNum(d.audiencias.total)}
            description={d.audiencias.proximos7dias > 0
              ? `${d.audiencias.proximos7dias} nos próximos 7 dias`
              : 'Nenhuma esta semana'}
            icon={Calendar}
            href="/app/audiencias"
          />
        )}
        {podeVerExpedientes && (
          <Kpi
            label="Expedientes Pendentes"
            value={fmtNum(d.expedientes.total)}
            description={d.expedientes.vencidos > 0
              ? `${d.expedientes.vencidos} vencidos`
              : 'Nenhum vencido'}
            icon={FileText}
            href="/app/expedientes"
          />
        )}
        {podeVerFinanceiro && (
          <>
            <Kpi label="Saldo Total" value={fmtMoeda(d.dadosFinanceiros.saldoTotal)} icon={Wallet} />
            <Kpi
              label="Contas a Pagar"
              value={fmtMoeda(d.dadosFinanceiros.contasPagar.valor)}
              description={`${d.dadosFinanceiros.contasPagar.quantidade} pendentes`}
              icon={ArrowDownLeft}
            />
            <Kpi
              label="Contas a Receber"
              value={fmtMoeda(d.dadosFinanceiros.contasReceber.valor)}
              description={`${d.dadosFinanceiros.contasReceber.quantidade} pendentes`}
              icon={ArrowUpRight}
            />
          </>
        )}
      </div>

      {/* Audiências & Expedientes */}
      {(podeVerAudiencias || podeVerExpedientes) && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {podeVerAudiencias && (
            <div className="lg:col-span-4">
              <WidgetAudienciasProximas data={d.proximasAudiencias} />
            </div>
          )}
          {podeVerExpedientes && (
            <div className={podeVerAudiencias ? 'lg:col-span-3' : 'lg:col-span-7'}>
              <WidgetExpedientesUrgentes data={d.expedientesUrgentes} />
            </div>
          )}
        </div>
      )}

      {/* Processos & Produtividade */}
      {podeVerProcessos && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <WidgetProcessosResumo data={d.processos} />
          <WidgetProdutividade data={d.produtividade} />
        </div>
      )}

      {/* Financeiro */}
      {podeVerFinanceiro && (
        <>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <WidgetFluxoCaixa />
            </div>
            <div className="lg:col-span-3">
              <WidgetDespesasCategoria />
            </div>
          </div>
          <ObrigacoesRecentesCard />
        </>
      )}

      {/* Pessoal */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <TarefasWidget initialTasks={tarefas} />
        <LembretesWidget lembretes={lembretes} />
        {currentUserId > 0 && <ChatWidget currentUserId={currentUserId} currentUserName={currentUserName} />}
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        Atualizado em {new Date(d.ultimaAtualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  );
}

// ============================================================================
// Admin Dashboard
// ============================================================================

function AdminContent({ data, progresso, lembretes, tarefas, currentUserId, currentUserName }: ContentProps) {
  const d = data as DashboardAdminData;

  return (
    <div className="space-y-4">
      <Heading level="page">
        {getSaudacao()}, {d.usuario.nome}!
      </Heading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressKpi progresso={progresso} />
        <Kpi
          label="Processos"
          value={fmtNum(d.metricas.totalProcessos)}
          description={`${fmtNum(d.metricas.processosAtivos)} ativos · ${fmtNum(d.metricas.processosArquivados)} arquivados`}
          icon={Scale}
          href="/app/processos"
        />
        <Kpi
          label="Audiências do Mês"
          value={fmtNum(d.metricas.audienciasMes)}
          description={`${fmtNum(d.metricas.totalAudiencias)} total`}
          icon={Calendar}
          href="/app/audiencias"
        />
        <Kpi
          label="Expedientes Pendentes"
          value={fmtNum(d.metricas.expedientesPendentes)}
          description={d.metricas.expedientesVencidos > 0 ? `${d.metricas.expedientesVencidos} vencidos` : 'Nenhum vencido'}
          icon={FileText}
          href="/app/expedientes"
        />
        <Kpi label="Saldo Total" value={fmtMoeda(d.dadosFinanceiros.saldoTotal)} icon={Wallet} />
        <Kpi
          label="Contas a Pagar"
          value={fmtMoeda(d.dadosFinanceiros.contasPagar.valor)}
          description={`${d.dadosFinanceiros.contasPagar.quantidade} pendentes`}
          icon={ArrowDownLeft}
        />
        <Kpi
          label="Contas a Receber"
          value={fmtMoeda(d.dadosFinanceiros.contasReceber.valor)}
          description={`${d.dadosFinanceiros.contasReceber.quantidade} pendentes`}
          icon={ArrowUpRight}
        />
        <Kpi label="Usuários Ativos" value={fmtNum(d.metricas.totalUsuarios)} icon={Users} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <WidgetAudienciasProximas data={d.proximasAudiencias} />
        </div>
        <div className="lg:col-span-3">
          <WidgetExpedientesUrgentes data={d.expedientesUrgentes} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <WidgetFluxoCaixa />
        </div>
        <div className="lg:col-span-3">
          <WidgetDespesasCategoria />
        </div>
      </div>

      <ObrigacoesRecentesCard />

      <AdminWidgets
        performanceAdvogados={d.performanceAdvogados}
        statusCapturas={d.statusCapturas}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <TarefasWidget initialTasks={tarefas} />
        <LembretesWidget lembretes={lembretes} />
        {currentUserId > 0 && <ChatWidget currentUserId={currentUserId} currentUserName={currentUserName} />}
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        Atualizado em {new Date(d.ultimaAtualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

export function DashboardUnificada({
  currentUserId,
  currentUserName,
  initialProgresso,
  initialLembretes,
  initialTarefas,
}: DashboardUnificadaProps) {
  const { data, isAdmin, isLoading, error, refetch } = useDashboard();

  // ── Copilot: expor contexto do dashboard ──
  const dashboardContext = useMemo(() => {
    if (!data) return { usuario: currentUserName, perfil: isAdmin ? 'administrador' : 'usuario', carregando: isLoading };

    if (data.role === 'admin') {
      const d = data as DashboardAdminData;
      return {
        usuario: currentUserName,
        perfil: 'administrador',
        metricas: {
          processos_ativos: d.metricas.processosAtivos,
          processos_arquivados: d.metricas.processosArquivados,
          audiencias_mes: d.metricas.audienciasMes,
          expedientes_pendentes: d.metricas.expedientesPendentes,
          expedientes_vencidos: d.metricas.expedientesVencidos,
          total_usuarios: d.metricas.totalUsuarios,
          taxa_resolucao: d.metricas.taxaResolucao,
        },
        tarefas_pendentes: initialTarefas.filter(t => t.status !== 'done').length,
        total_lembretes: initialLembretes.length,
        carregando: false,
      };
    }

    const d = data as DashboardUsuarioData;
    return {
      usuario: currentUserName,
      perfil: 'usuario',
      metricas: {
        processos_ativos: d.processos.ativos,
        processos_total: d.processos.total,
        audiencias_hoje: d.audiencias.hoje,
        audiencias_proximos_7_dias: d.audiencias.proximos7dias,
        expedientes_vencidos: d.expedientes.vencidos,
        expedientes_vence_hoje: d.expedientes.venceHoje,
      },
      tarefas_pendentes: initialTarefas.filter(t => t.status !== 'done').length,
      total_lembretes: initialLembretes.length,
      carregando: false,
    };
  }, [data, isAdmin, currentUserName, initialTarefas, initialLembretes, isLoading]);

  useAgentContext({
    description: 'Resumo do dashboard: métricas do escritório, tarefas e lembretes',
    value: JSON.parse(JSON.stringify(dashboardContext)),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={refetch} />;
  if (!data) return <DashboardError error="Dados não disponíveis" onRetry={refetch} />;

  const props: ContentProps = {
    data,
    progresso: initialProgresso,
    lembretes: initialLembretes,
    tarefas: initialTarefas,
    currentUserId,
    currentUserName,
  };

  return isAdmin ? <AdminContent {...props} /> : <UserContent {...props} />;
}
