/**
 * WIDGET GALLERY — Seção: Processos
 * ============================================================================
 * Widgets de visualização do módulo de Processos (causas jurídicas).
 * Estética "Glass Briefing" — painel escuro, bordas sutis, dados compactos.
 *
 * USO: import { ProcessosWidgets } from './section-processos'
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { BarChart3, PieChart, Scale, TrendingUp, LayoutGrid, Activity, HeartPulse, Flame, Layers } from 'lucide-react';
import {
  GallerySection,
  WidgetContainer,
  Sparkline,
  MiniDonut,
  StackedBar,
  Stat,
  ProgressRing,
  UrgencyDot,
  ListItem,
  MiniArea,
  fmtNum,
  GaugeMeter,
  InsightBanner,
  ComparisonStat,
  CalendarHeatmap,
  TabToggle,
  Treemap,
} from './primitives';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const STATUS_SEGMENTS = [
  { value: 89, color: 'hsl(var(--primary))',       label: 'Ativos' },
  { value: 7,  color: 'hsl(var(--warning))',        label: 'Suspensos' },
  { value: 31, color: 'hsl(var(--muted-foreground) / 0.55)', label: 'Arquivados' },
  { value: 12, color: 'hsl(220 70% 60%)',           label: 'Em Recurso' },
];

const TRT_DATA = [
  { label: 'TRT1 — RJ',         value: 34 },
  { label: 'TRT2 — SP',         value: 28 },
  { label: 'TRT3 — MG',         value: 19 },
  { label: 'TRT15 — Campinas',  value: 15 },
  { label: 'TRT4 — RS',         value: 11 },
];

// últimos 8 meses: Jul → Fev
const MONTHLY_TREND = [8, 11, 9, 14, 12, 17, 13, 16];
const MONTH_LABELS  = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'];

const AGING_SEGMENTS = [
  { value: 45, color: 'hsl(142 60% 45%)',  label: '< 1 ano' },
  { value: 32, color: 'hsl(60  70% 50%)',  label: '1–2 anos' },
  { value: 28, color: 'hsl(30  80% 52%)',  label: '2–5 anos' },
  { value: 22, color: 'hsl(0   70% 55%)',  label: '> 5 anos' },
];

const SEGMENTO_SEGMENTS = [
  { value: 68, color: 'hsl(var(--primary))',  label: 'Trabalhista' },
  { value: 31, color: 'hsl(220 70% 60%)',     label: 'Cível' },
  { value: 15, color: 'hsl(280 60% 60%)',     label: 'Previdenciário' },
  { value: 8,  color: 'hsl(var(--warning))',  label: 'Empresarial' },
  { value: 5,  color: 'hsl(var(--destructive))', label: 'Criminal' },
];

const TOTAL_PROCESSOS  = 139;
const ATIVOS_COUNT     = 89;
const RESOLVIDOS_MES   = 13;
const NOVOS_MES        = 16;
const TAXA_RESOLUCAO   = Math.round((RESOLVIDOS_MES / (RESOLVIDOS_MES + NOVOS_MES)) * 100);

const TRT_MAX = TRT_DATA[0].value;

// ─── Widget 1: Distribuição por Status ──────────────────────────────────────

export function WidgetStatusDistribuicao() {
  const total = STATUS_SEGMENTS.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Distribuição por Status"
      icon={PieChart}
      subtitle="Total de processos ativos"
      depth={1}
      className="md:col-span-2"
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={STATUS_SEGMENTS}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {STATUS_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {seg.label}
              </span>
              <span className="text-[10px] font-medium tabular-nums">
                {fmtNum(seg.value)}
              </span>
              <span className="text-[9px] text-muted-foreground/60 w-7 text-right tabular-nums">
                {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 2: Casos por Tribunal (TRT) ─────────────────────────────────────

export function WidgetCasosTribunal() {
  return (
    <WidgetContainer
      title="Casos por Tribunal"
      icon={Scale}
      subtitle="Top 5 TRTs — volume atual"
      depth={1}
    >
      <div className="flex flex-col gap-2.5">
        {TRT_DATA.map((trt) => {
          const pct = Math.round((trt.value / TRT_MAX) * 100);
          return (
            <div key={trt.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground/70 truncate leading-none">
                  {trt.label}
                </span>
                <span className="text-[10px] font-semibold tabular-nums ml-2 shrink-0">
                  {trt.value}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 3: Tendência de Novos Processos ──────────────────────────────────

export function WidgetTendenciaNovos() {
  const current = MONTHLY_TREND[MONTHLY_TREND.length - 1];
  const prev    = MONTHLY_TREND[MONTHLY_TREND.length - 2];
  const delta   = current - prev;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} vs. mês anterior`;

  return (
    <WidgetContainer
      title="Novos Processos"
      icon={TrendingUp}
      subtitle="Tendência — últimos 8 meses"
      depth={1}
    >
      <div className="flex items-end justify-between gap-3 mb-3">
        <Stat
          label="Este mês"
          value={fmtNum(current)}
          delta={deltaLabel}
          deltaType={delta > 0 ? 'negative' : 'positive'}
        />
        <MiniArea
          data={MONTHLY_TREND}
          width={110}
          height={44}
          color="hsl(var(--primary))"
        />
      </div>
      <div className="flex items-end justify-between pt-2 border-t border-border/10">
        {MONTHLY_TREND.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 tabular-nums">{v}</span>
            <span className="text-[8px] text-muted-foreground/55">{MONTH_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4: Análise de Aging ──────────────────────────────────────────────

export function WidgetAging() {
  const total = AGING_SEGMENTS.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Aging dos Processos"
      icon={BarChart3}
      subtitle="Distribuição por tempo de duração"
      depth={1}
    >
      <StackedBar segments={AGING_SEGMENTS} height={10} />
      <div className="flex flex-col gap-2.5 mt-4">
        {AGING_SEGMENTS.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                {seg.label}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-border/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums w-6 text-right">
                  {seg.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5: Processos por Segmento ───────────────────────────────────────

export function WidgetSegmento() {
  const total = SEGMENTO_SEGMENTS.reduce((s, seg) => s + seg.value, 0);
  const dominant = SEGMENTO_SEGMENTS[0];

  return (
    <WidgetContainer
      title="Por Segmento"
      icon={LayoutGrid}
      subtitle="Distribuição por área jurídica"
      depth={1}
    >
      <div className="flex items-center gap-4">
        <MiniDonut
          segments={SEGMENTO_SEGMENTS}
          size={76}
          strokeWidth={10}
          centerLabel={`${Math.round((dominant.value / total) * 100)}%`}
        />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {SEGMENTO_SEGMENTS.map((seg) => {
            const pct = Math.round((seg.value / total) * 100);
            return (
              <div key={seg.label} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                  {seg.label}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/50">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border/10">
        <StackedBar segments={SEGMENTO_SEGMENTS} height={6} />
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 6: KPI Pulse ─────────────────────────────────────────────────────

export function WidgetKpiPulse() {
  return (
    <WidgetContainer
      title="Painel KPI"
      icon={Activity}
      subtitle="Resumo operacional — março 2026"
      depth={2}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <Stat
          label="Total"
          value={fmtNum(TOTAL_PROCESSOS)}
          delta="carteira ativa"
          deltaType="neutral"
        />
        <Stat
          label="Ativos"
          value={fmtNum(ATIVOS_COUNT)}
          delta={`${Math.round((ATIVOS_COUNT / TOTAL_PROCESSOS) * 100)}% do total`}
          deltaType="neutral"
        />
        <Stat
          label="Novos / mês"
          value={fmtNum(NOVOS_MES)}
          delta="+3 vs. jan"
          deltaType="alert"
          small
        />
        <Stat
          label="Resolvidos / mês"
          value={fmtNum(RESOLVIDOS_MES)}
          delta="+1 vs. jan"
          deltaType="positive"
          small
        />
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-border/10">
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={TAXA_RESOLUCAO}
            size={48}
            color="hsl(142 60% 45%)"
          />
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Taxa de Resolução
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              encerrados / (enc. + novos)
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-end gap-1">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Tendência 8m
          </p>
          <Sparkline
            data={MONTHLY_TREND}
            width={72}
            height={24}
            color="hsl(142 60% 45%)"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/10">
        {[
          { label: 'Prazo vencendo esta semana', count: 4, level: 'alto' as const },
          { label: 'Audiências no mês',           count: 9, level: 'medio' as const },
          { label: 'Aguardando documentos',       count: 6, level: 'baixo' as const },
        ].map((item) => (
          <ListItem key={item.label}>
            <UrgencyDot level={item.level} />
            <span className="text-[10px] text-muted-foreground/70 flex-1 truncate">
              {item.label}
            </span>
            <span className="text-[10px] font-semibold tabular-nums">{item.count}</span>
          </ListItem>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 7: Saúde Processual (Hero) ──────────────────────────────────────

const SAUDE_SCORE = (() => {
  const pctAtivos      = (ATIVOS_COUNT / TOTAL_PROCESSOS) * 100; // positive
  const pctVencidos    = (4 / TOTAL_PROCESSOS) * 100;            // negative (4 vencendo esta semana)
  const taxaResolucao  = TAXA_RESOLUCAO;                          // positive
  // composite: 40% ativos weight, 30% resolucao, 30% penalty vencidos
  const raw = (pctAtivos * 0.4) + (taxaResolucao * 0.3) - (pctVencidos * 0.3 * 3);
  return Math.max(0, Math.min(100, Math.round(raw)));
})();

const SAUDE_STATUS: 'good' | 'warning' | 'danger' =
  SAUDE_SCORE > 70 ? 'good' : SAUDE_SCORE >= 40 ? 'warning' : 'danger';

export function WidgetSaudeProcessual() {
  return (
    <WidgetContainer
      title="Saúde do Portfólio"
      icon={HeartPulse}
      subtitle="Score composto — ativos, resolução e vencimentos"
      depth={2}
      className="md:col-span-2"
    >
      <div className="flex flex-col gap-4">
        {/* Gauge + comparisons */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col items-center gap-1">
            <GaugeMeter
              value={SAUDE_SCORE}
              max={100}
              label="score geral"
              status={SAUDE_STATUS}
              size={120}
            />
          </div>
          <div className="flex flex-1 gap-6 flex-wrap min-w-0">
            <ComparisonStat
              label="Ativos"
              current={89}
              previous={82}
              format="number"
            />
            <ComparisonStat
              label="Encerrados no mês"
              current={13}
              previous={9}
              format="number"
            />
            <div className="flex flex-col gap-1">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Tempo médio
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">8,2 meses</span>
                <span className="text-[10px] font-medium text-success/70">-9,9%</span>
              </div>
              <p className="text-[9px] text-muted-foreground/55">anterior: 9,1 meses</p>
            </div>
          </div>
        </div>
        {/* Insight */}
        <InsightBanner type="warning">
          3 processos sem movimentação há 60+ dias — considere ação
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 8: Heatmap de Atividade ─────────────────────────────────────────

const HEATMAP_DATA: number[] = [
  // semana 1: 03/fev – 09/fev
  1, 3, 2, 4, 3, 0, 0,
  // semana 2: 10/fev – 16/fev
  2, 5, 3, 6, 4, 1, 0,
  // semana 3: 17/fev – 23/fev
  0, 2, 4, 3, 2, 0, 1,
  // semana 4: 24/fev – 02/mar
  3, 4, 5, 2, 6, 0, 0,
  // semana 5: 03/mar – 09/mar
  1, 3, 4, 6, 5, 2, 0,
];

export function WidgetHeatmapAtividade() {
  return (
    <WidgetContainer
      title="Movimentações Processuais"
      icon={Flame}
      subtitle="Frequência diária — últimas 5 semanas"
      depth={1}
    >
      <div className="flex flex-col gap-3">
        <CalendarHeatmap data={HEATMAP_DATA} colorScale="primary" />
        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/55">0</span>
          <div className="flex gap-0.5">
            {['bg-border/10', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map(
              (cls, i) => (
                <div key={i} className={`size-3 rounded-[3px] ${cls}`} />
              )
            )}
          </div>
          <span className="text-[9px] text-muted-foreground/55">5+</span>
          <span className="text-[9px] text-muted-foreground/45 ml-1">
            baixo → alto
          </span>
        </div>
        {/* Stats abaixo */}
        <div className="flex gap-4 pt-2 border-t border-border/10">
          <Stat label="Média diária" value="2,8 mov/dia" small />
          <Stat label="Pico" value="6 em 12/mar" small />
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 9: Processos com Tabs ────────────────────────────────────────────

const TREEMAP_STATUS = [
  { value: 89, label: 'Ativos',     color: 'hsl(var(--primary))' },
  { value: 7,  label: 'Suspensos',  color: 'hsl(var(--warning))' },
  { value: 31, label: 'Arquivados', color: 'hsl(var(--muted-foreground) / 0.4)' },
  { value: 12, label: 'Em Recurso', color: 'hsl(220 70% 60%)' },
];

const TREEMAP_SEGMENTO = [
  { value: 68, label: 'Trabalhista',    color: 'hsl(var(--primary))' },
  { value: 31, label: 'Cível',          color: 'hsl(var(--warning))' },
  { value: 15, label: 'Previdenciário', color: 'hsl(142 60% 45%)' },
  { value: 8,  label: 'Empresarial',    color: 'hsl(220 70% 60%)' },
  { value: 5,  label: 'Criminal',       color: 'hsl(var(--destructive))' },
];

const TAB_OPTIONS = [
  { id: 'status',   label: 'Status' },
  { id: 'segmento', label: 'Segmento' },
];

export function WidgetProcessosComTabs() {
  const [activeTab, setActiveTab] = useState<string>('status');

  const treemapData = activeTab === 'status' ? TREEMAP_STATUS : TREEMAP_SEGMENTO;
  const total = treemapData.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Proporção de Processos"
      icon={Layers}
      subtitle="Visualização interativa por agrupamento"
      depth={1}
      action={
        <TabToggle
          tabs={TAB_OPTIONS}
          active={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <Treemap segments={treemapData} height={84} />
        {/* Legend row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {treemapData.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[9px] text-muted-foreground/50">
                {seg.label}{' '}
                <span className="text-muted-foreground/55">
                  ({Math.round((seg.value / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Export principal ────────────────────────────────────────────────────────

export function ProcessosWidgets() {
  return (
    <GallerySection
      title="Processos"
      description="Visualizações do módulo de causas jurídicas — distribuição, tendências e indicadores operacionais."
    >
      <WidgetStatusDistribuicao />
      <WidgetCasosTribunal />
      <WidgetTendenciaNovos />
      <WidgetAging />
      <WidgetSegmento />
      <WidgetKpiPulse />
      <WidgetSaudeProcessual />
      <WidgetHeatmapAtividade />
      <WidgetProcessosComTabs />
    </GallerySection>
  );
}
