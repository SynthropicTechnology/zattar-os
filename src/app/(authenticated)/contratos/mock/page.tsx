'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  ChevronRight,
  Clock,
  Building2,
  ArrowRight,
  Kanban,
  List,
  GitBranch,
  DollarSign,
} from 'lucide-react';
import {
  GlassPanel,
  fmtMoeda,
  InsightBanner,
  Sparkline,
  ProgressRing,
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';

// ============================================================================
// CONTRATOS MOCK — "Contract Pipeline Intelligence"
// ============================================================================
// Acesse em: /app/contratos/mock
// Conceito: Funil de conversão + overlay financeiro + inteligência.
// Não é uma lista. É um pipeline que mostra dinheiro e conversão.
// ============================================================================

// ─── Types ──────────────────────────────────────────────────────────────

type StatusContrato = 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';
type ViewMode = 'pipeline' | 'kanban' | 'lista';

interface ContratoCard {
  id: number;
  cliente: string;
  clienteTipo: 'pf' | 'pj';
  parteContraria?: string;
  tipo: string;
  cobranca: string;
  segmento: string;
  status: StatusContrato;
  valor: number;
  cadastradoEm: string;
  responsavel: string;
  diasNoEstagio: number;
  processosVinculados: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────

const PIPELINE_STAGES: { id: StatusContrato; label: string; color: string; colorBg: string }[] = [
  { id: 'em_contratacao', label: 'Em Contratação', color: 'hsl(var(--warning))', colorBg: 'bg-warning' },
  { id: 'contratado', label: 'Contratado', color: 'hsl(var(--primary))', colorBg: 'bg-primary' },
  { id: 'distribuido', label: 'Distribuído', color: 'hsl(var(--success))', colorBg: 'bg-success' },
  { id: 'desistencia', label: 'Desistência', color: 'hsl(var(--destructive))', colorBg: 'bg-destructive' },
];

const CONTRATOS: ContratoCard[] = [
  { id: 1, cliente: 'Maria Fernanda Silva', clienteTipo: 'pf', parteContraria: 'Tech Solutions Ltda.', tipo: 'Ajuizamento', cobranca: 'Pro Êxito', segmento: 'Trabalhista', status: 'em_contratacao', valor: 45000, cadastradoEm: '2026-03-28', responsavel: 'Dr. Marcos', diasNoEstagio: 3, processosVinculados: 0 },
  { id: 2, cliente: 'João Carlos Pereira', clienteTipo: 'pf', parteContraria: 'Construtora Nova Era', tipo: 'Defesa', cobranca: 'Pro Labore', segmento: 'Cível', status: 'em_contratacao', valor: 28000, cadastradoEm: '2026-03-15', responsavel: 'Dra. Patrícia', diasNoEstagio: 16, processosVinculados: 0 },
  { id: 3, cliente: 'Indústrias Paulista S/A', clienteTipo: 'pj', parteContraria: 'Roberto Mendes', tipo: 'Defesa', cobranca: 'Pro Labore', segmento: 'Trabalhista', status: 'em_contratacao', valor: 35000, cadastradoEm: '2026-02-20', responsavel: 'Dr. Marcos', diasNoEstagio: 39, processosVinculados: 0 },
  { id: 4, cliente: 'Ana Beatriz Costa', clienteTipo: 'pf', tipo: 'Assessoria', cobranca: 'Pro Labore', segmento: 'Previdenciário', status: 'em_contratacao', valor: 12000, cadastradoEm: '2026-03-25', responsavel: 'Dra. Patrícia', diasNoEstagio: 6, processosVinculados: 0 },
  { id: 5, cliente: 'Fernanda Oliveira', clienteTipo: 'pf', parteContraria: 'Banco Central', tipo: 'Ajuizamento', cobranca: 'Pro Êxito', segmento: 'Trabalhista', status: 'em_contratacao', valor: 60000, cadastradoEm: '2026-03-10', responsavel: 'Dr. Marcos', diasNoEstagio: 21, processosVinculados: 0 },

  { id: 6, cliente: 'Tech Solutions Ltda.', clienteTipo: 'pj', parteContraria: 'Maria Silva', tipo: 'Defesa', cobranca: 'Pro Labore', segmento: 'Trabalhista', status: 'contratado', valor: 32000, cadastradoEm: '2026-03-01', responsavel: 'Dr. Marcos', diasNoEstagio: 12, processosVinculados: 1 },
  { id: 7, cliente: 'Construtora Nova Era', clienteTipo: 'pj', parteContraria: 'Carlos Ferreira', tipo: 'Defesa', cobranca: 'Pro Labore', segmento: 'Cível', status: 'contratado', valor: 55000, cadastradoEm: '2026-02-15', responsavel: 'Dra. Patrícia', diasNoEstagio: 8, processosVinculados: 2 },

  { id: 8, cliente: 'Maria Fernanda Silva', clienteTipo: 'pf', parteContraria: 'Empresa ABC', tipo: 'Ajuizamento', cobranca: 'Pro Êxito', segmento: 'Trabalhista', status: 'distribuido', valor: 85000, cadastradoEm: '2026-01-10', responsavel: 'Dr. Marcos', diasNoEstagio: 45, processosVinculados: 3 },
  { id: 9, cliente: 'Tech Solutions Ltda.', clienteTipo: 'pj', parteContraria: 'João Pereira', tipo: 'Defesa', cobranca: 'Pro Labore', segmento: 'Trabalhista', status: 'distribuido', valor: 42000, cadastradoEm: '2025-12-05', responsavel: 'Dra. Patrícia', diasNoEstagio: 90, processosVinculados: 2 },
  { id: 10, cliente: 'Fernanda Oliveira', clienteTipo: 'pf', parteContraria: 'Metalúrgica SP', tipo: 'Ajuizamento', cobranca: 'Pro Êxito', segmento: 'Trabalhista', status: 'distribuido', valor: 120000, cadastradoEm: '2025-11-20', responsavel: 'Dr. Marcos', diasNoEstagio: 120, processosVinculados: 4 },
  { id: 11, cliente: 'Ana Beatriz Costa', clienteTipo: 'pf', tipo: 'Consultoria', cobranca: 'Pro Labore', segmento: 'Previdenciário', status: 'distribuido', valor: 18000, cadastradoEm: '2026-02-01', responsavel: 'Dra. Patrícia', diasNoEstagio: 30, processosVinculados: 1 },

  { id: 12, cliente: 'Carlos Eduardo', clienteTipo: 'pf', tipo: 'Assessoria', cobranca: 'Pro Labore', segmento: 'Empresarial', status: 'desistencia', valor: 15000, cadastradoEm: '2026-02-10', responsavel: 'Dra. Patrícia', diasNoEstagio: 0, processosVinculados: 0 },
];

const STATS = {
  total: 68,
  emCarteira: 2_145_000,
  novosMes: 4,
  taxaConversao: 78,
  ticketMedio: 42_350,
  trendMensal: [52, 58, 55, 62, 60, 68],
};

// ─── Helpers ────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  return nome.split(' ').filter(p => p.length > 2).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function getStageContratos(status: StatusContrato) {
  return CONTRATOS.filter(c => c.status === status);
}

function getStageTotal(status: StatusContrato) {
  return getStageContratos(status).reduce((sum, c) => sum + c.valor, 0);
}

// ─── Pipeline Funnel ────────────────────────────────────────────────────

function PipelineFunnel() {
  const stages = PIPELINE_STAGES.filter(s => s.id !== 'desistencia');
  const maxCount = Math.max(...stages.map(s => getStageContratos(s.id).length));
  const desistencias = getStageContratos('desistencia');

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="size-4 text-muted-foreground/50" />
        <h2 className="font-heading text-sm font-semibold">Pipeline de Conversão</h2>
        <span className="text-[10px] text-muted-foreground/55 ml-auto">
          {desistencias.length} desistência{desistencias.length !== 1 ? 's' : ''} ({fmtMoeda(getStageTotal('desistencia'))})
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        {stages.map((stage, i) => {
          const contratos = getStageContratos(stage.id);
          const valor = getStageTotal(stage.id);
          const count = contratos.length;
          const barWidth = maxCount > 0 ? Math.max(20, (count / maxCount) * 100) : 20;
          const prevCount = i > 0 ? getStageContratos(stages[i - 1].id).length : count;
          const convRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 100;

          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-2">
              {/* Stage header */}
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{stage.label}</p>
                <p className="font-display text-2xl font-bold mt-0.5">{count}</p>
                <p className="text-xs text-muted-foreground/50 tabular-nums">{fmtMoeda(valor)}</p>
              </div>

              {/* Funnel bar */}
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: stage.color,
                  opacity: 0.6,
                }}
              />

              {/* Conversion rate */}
              {i > 0 && (
                <div className="flex items-center gap-1 text-[10px]">
                  <ArrowRight className="size-2.5 text-muted-foreground/55" />
                  <span className={convRate >= 70 ? 'text-success/60' : convRate >= 50 ? 'text-warning/60' : 'text-destructive/60'}>
                    {convRate}%
                  </span>
                </div>
              )}
              {i === 0 && <div className="h-4" />}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────

function KanbanColumn({ stage, contratos }: { stage: typeof PIPELINE_STAGES[0]; contratos: ContratoCard[] }) {
  const total = contratos.reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="flex-1 min-w-65 flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pb-2 border-b-2" style={{ borderColor: stage.color }}>
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-semibold">{stage.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/10 text-muted-foreground/50 tabular-nums">
            {contratos.length}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums font-medium">
          {fmtMoeda(total)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {contratos.map(c => (
          <KanbanCard key={c.id} contrato={c} stageColor={stage.color} />
        ))}
        {contratos.length === 0 && (
          <div className="py-8 text-center text-[10px] text-muted-foreground/50">
            Nenhum contrato
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ contrato: c, stageColor: _stageColor }: { contrato: ContratoCard; stageColor: string }) {
  const isStuck = c.diasNoEstagio > 30;

  return (
    <GlassPanel className={`p-3 cursor-pointer hover:scale-[1.01] ${isStuck ? 'ring-1 ring-warning/20' : ''}`}>
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
          {c.clienteTipo === 'pj' ? (
            <Building2 className="size-3.5 text-primary/60" />
          ) : (
            <span className="text-[9px] font-bold text-primary/60">{getInitials(c.cliente)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Client name */}
          <p className="text-[11px] font-semibold truncate leading-tight">{c.cliente}</p>
          {c.parteContraria && (
            <p className="text-[9px] text-muted-foreground/55 truncate">vs. {c.parteContraria}</p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/6 text-primary/50">{c.tipo}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-border/10 text-muted-foreground/60">{c.cobranca}</span>
            {c.processosVinculados > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-info/6 text-info/50">
                {c.processosVinculados} proc.
              </span>
            )}
          </div>

          {/* Bottom: valor + dias */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-bold tabular-nums text-primary/70">{fmtMoeda(c.valor)}</span>
            <span className={`text-[9px] flex items-center gap-0.5 ${isStuck ? 'text-warning/60' : 'text-muted-foreground/55'}`}>
              <Clock className="size-2.5" />
              {c.diasNoEstagio}d
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── List Row ───────────────────────────────────────────────────────────

function ContratoListRow({ contrato: c }: { contrato: ContratoCard }) {
  const stage = PIPELINE_STAGES.find(s => s.id === c.status)!;
  const isStuck = c.diasNoEstagio > 30;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/4 ${isStuck ? 'ring-1 ring-warning/10' : ''}`}>
      {/* Status dot */}
      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color, opacity: 0.6 }} />

      {/* Avatar */}
      <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        {c.clienteTipo === 'pj' ? (
          <Building2 className="size-3.5 text-primary/60" />
        ) : (
          <span className="text-[9px] font-bold text-primary/60">{getInitials(c.cliente)}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{c.cliente}</p>
        {c.parteContraria && <p className="text-[10px] text-muted-foreground/55 truncate">vs. {c.parteContraria}</p>}
      </div>

      {/* Type */}
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/6 text-primary/50 shrink-0 hidden sm:block">{c.tipo}</span>

      {/* Stage */}
      <span className="text-[9px] font-medium shrink-0 hidden md:block w-24 text-right" style={{ color: stage.color }}>{stage.label}</span>

      {/* Value */}
      <span className="text-[11px] font-bold tabular-nums shrink-0 w-24 text-right">{fmtMoeda(c.valor)}</span>

      {/* Days */}
      <span className={`text-[9px] shrink-0 w-10 text-right ${isStuck ? 'text-warning/60' : 'text-muted-foreground/50'}`}>
        {c.diasNoEstagio}d
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}

// ─── Financial Overlay Strip ────────────────────────────────────────────

function FinancialStrip() {
  return (
    <GlassPanel className="px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <DollarSign className="size-4 text-muted-foreground/55" />
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Em Carteira</p>
            <p className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={STATS.emCarteira} prefix="R$ " duration={1200} />
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Ticket Médio</p>
          <p className="font-display text-base font-bold tabular-nums">{fmtMoeda(STATS.ticketMedio)}</p>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Conversão</p>
          <div className="flex items-center gap-2">
            <ProgressRing percent={STATS.taxaConversao} size={32} color="hsl(var(--success))" />
            <span className="text-xs font-bold text-success/70">{STATS.taxaConversao}%</span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Tendência 6m</p>
            <p className="text-xs font-semibold text-success/60">+{STATS.novosMes} este mês</p>
          </div>
          <Sparkline data={STATS.trendMensal} width={60} height={20} color="hsl(var(--success))" />
        </div>
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function ContratosMockPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [search, setSearch] = useState('');
  const [activeSegmento, setActiveSegmento] = useState('todos');

  const filteredContratos = CONTRATOS.filter(c => {
    if (activeSegmento !== 'todos' && c.segmento.toLowerCase() !== activeSegmento) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.cliente.toLowerCase().includes(s) || c.parteContraria?.toLowerCase().includes(s) || c.tipo.toLowerCase().includes(s);
    }
    return true;
  });

  const stuckContratos = CONTRATOS.filter(c => c.diasNoEstagio > 30 && c.status === 'em_contratacao');

  return (
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {STATS.total} contratos &middot; {fmtMoeda(STATS.emCarteira)} em carteira
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          <Plus className="size-3.5" />
          Novo contrato
        </button>
      </div>

      {/* ── Financial Strip ─────────────────────────────── */}
      <FinancialStrip />

      {/* ── Pipeline Funnel ─────────────────────────────── */}
      <PipelineFunnel />

      {/* ── Insight ─────────────────────────────────────── */}
      {stuckContratos.length > 0 && (
        <InsightBanner type="warning">
          {stuckContratos.length} contrato{stuckContratos.length > 1 ? 's' : ''} em negociação há 30+ dias ({fmtMoeda(stuckContratos.reduce((s, c) => s + c.valor, 0))}) — considere follow-up
        </InsightBanner>
      )}

      {/* ── View Controls ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={[
            { id: 'todos', label: 'Todos', count: STATS.total },
            { id: 'trabalhista', label: 'Trabalhista', count: CONTRATOS.filter(c => c.segmento === 'Trabalhista').length },
            { id: 'cível', label: 'Cível', count: CONTRATOS.filter(c => c.segmento === 'Cível').length },
            { id: 'previdenciário', label: 'Previdenciário', count: CONTRATOS.filter(c => c.segmento === 'Previdenciário').length },
            { id: 'empresarial', label: 'Empresarial', count: CONTRATOS.filter(c => c.segmento === 'Empresarial').length },
          ]}
          active={activeSegmento}
          onChange={setActiveSegmento}
        />

        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente, parte, tipo..." />
          {/* View toggle */}
          <div className="flex p-0.5 rounded-lg bg-border/6">
            {([
              { mode: 'pipeline' as ViewMode, icon: GitBranch, label: 'Pipeline' },
              { mode: 'kanban' as ViewMode, icon: Kanban, label: 'Kanban' },
              { mode: 'lista' as ViewMode, icon: List, label: 'Lista' },
            ]).map(v => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                aria-label={v.label}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === v.mode ? 'bg-primary/12 text-primary' : 'text-muted-foreground/55 hover:text-muted-foreground/50'}`}
              >
                <v.icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {viewMode === 'pipeline' && (
        <div className="space-y-4">
          {/* Pipeline visual — kanban-style but with financial emphasis */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map(stage => (
              <KanbanColumn key={stage.id} stage={stage} contratos={filteredContratos.filter(c => c.status === stage.id)} />
            ))}
          </div>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.filter(s => s.id !== 'desistencia').map(stage => (
            <KanbanColumn key={stage.id} stage={stage} contratos={filteredContratos.filter(c => c.status === stage.id)} />
          ))}
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="flex flex-col gap-1">
          {filteredContratos.map(c => (
            <ContratoListRow key={c.id} contrato={c} />
          ))}
          {filteredContratos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">Nenhum contrato encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────── */}
      <p className="text-center text-[10px] text-muted-foreground/50 pb-4">
        {'Protótipo — Contract Pipeline Intelligence — dados fictícios'}
      </p>
    </div>
  );
}
