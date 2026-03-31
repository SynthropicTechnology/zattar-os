/**
 * WIDGET GALLERY — Seção: Expedientes
 * ============================================================================
 * Módulo de prazos processuais e expedientes judiciais.
 * Estética "Glass Briefing" com ênfase em cores de urgência.
 * Dados fictícios representativos de um escritório de advocacia brasileiro.
 * ============================================================================
 */

'use client';

import { AlertTriangle, Clock, FileText, Activity, CalendarDays } from 'lucide-react';
import {
  AnimatedNumber,
  CalendarHeatmap,
  ComparisonStat,
  fmtData,
  fmtNum,
  GallerySection,
  GaugeMeter,
  InsightBanner,
  ListItem,
  MiniBar,
  MiniDonut,
  ProgressRing,
  Sparkline,
  StackedBar,
  Stat,
  UrgencyDot,
  WidgetContainer,
} from './primitives';

// ─── Paleta de urgência (Expedientes usa warm/alert com prioridade) ──────

const COLORS = {
  critico: 'hsl(var(--destructive))',
  alto:    'hsl(35 95% 58%)',   // warning amber
  medio:   'hsl(217 91% 60%)',  // blue
  baixo:   'hsl(var(--muted-foreground) / 0.55)',
  ok:      'hsl(142 71% 45%)',  // success green
  parcial: 'hsl(35 95% 58%)',
};

// ─── 1. Urgency List ─────────────────────────────────────────────────────
// Lista de expedientes ordenada por urgência — o widget principal do módulo.

const URGENCY_LIST_DATA = [
  {
    id: 1,
    title: 'Contestação — Proc. 0012.345-67.2024',
    prazo: '2025-03-29', // vencido
    level: 'critico' as const,
    origem: 'PJE',
  },
  {
    id: 2,
    title: 'Recurso Ordinário — TRT 2ª Região',
    prazo: '2025-03-30', // hoje
    level: 'alto' as const,
    origem: 'CNJ',
  },
  {
    id: 3,
    title: 'Impugnação ao Valor da Causa',
    prazo: '2025-04-02', // em 3d
    level: 'medio' as const,
    origem: 'Manual',
  },
  {
    id: 4,
    title: 'Memoriais Finais — Ação de Cobrança',
    prazo: '2025-04-06',
    level: 'baixo' as const,
    origem: 'PJE',
  },
  {
    id: 5,
    title: 'Petição de Juntada de Documentos',
    prazo: '2025-04-12',
    level: 'baixo' as const,
    origem: 'CNJ',
  },
];

const ORIGIN_BADGE_STYLES: Record<string, string> = {
  PJE:    'bg-primary/10 text-primary/70',
  CNJ:    'bg-warning/10 text-warning/70',
  Manual: 'bg-muted/30 text-muted-foreground/50',
};

const URGENCY_LABELS: Record<string, string> = {
  critico: 'Vencido',
  alto:    'Hoje',
  medio:   'Em 3d',
  baixo:   '7d+',
};

export function UrgencyList() {
  return (
    <WidgetContainer
      title="Expedientes Urgentes"
      icon={AlertTriangle}
      subtitle="Por urgência de prazo"
      depth={1}
      className="md:col-span-2"
    >
      <div className="space-y-0.5">
        {URGENCY_LIST_DATA.map((item) => (
          <ListItem key={item.id}>
            <UrgencyDot level={item.level} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium leading-tight truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {URGENCY_LABELS[item.level]} · {fmtData(item.prazo)}
              </p>
            </div>
            <span
              className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${ORIGIN_BADGE_STYLES[item.origem]}`}
            >
              {item.origem}
            </span>
          </ListItem>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── 2. Aging Funnel ─────────────────────────────────────────────────────
// Barras horizontais mostrando distribuição de prazos por janela de urgência.

const AGING_DATA = [
  { label: 'Vencidos',       count: 4,  color: COLORS.critico, level: 'critico' as const },
  { label: 'Vencem Hoje',    count: 2,  color: COLORS.alto,    level: 'alto' as const },
  { label: 'Próx. 7 dias',   count: 5,  color: COLORS.medio,   level: 'medio' as const },
  { label: 'Próx. 30 dias',  count: 8,  color: COLORS.baixo,   level: 'baixo' as const },
];

const AGING_MAX = Math.max(...AGING_DATA.map((d) => d.count));

export function AgingFunnel() {
  return (
    <WidgetContainer
      title="Funil de Vencimentos"
      icon={Clock}
      subtitle="Distribuição por janela de prazo"
      depth={1}
    >
      <div className="space-y-3 mt-1">
        {AGING_DATA.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <UrgencyDot level={row.level} />
            <div className="w-28 shrink-0">
              <span className="text-[11px] text-muted-foreground/60">{row.label}</span>
            </div>
            <div className="flex-1 h-5 flex items-center gap-2">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${(row.count / AGING_MAX) * 100}%`,
                  backgroundColor: row.color,
                  opacity: 0.75,
                }}
              />
              <span
                className="text-[12px] font-bold tabular-nums shrink-0"
                style={{ color: row.color }}
              >
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Total</span>
        <span className="text-sm font-bold">
          {fmtNum(AGING_DATA.reduce((s, d) => s + d.count, 0))}
        </span>
      </div>
    </WidgetContainer>
  );
}

// ─── 3. Origem Distribution ──────────────────────────────────────────────
// MiniDonut mostrando de onde os expedientes estão sendo capturados.

const ORIGEM_DATA = [
  { label: 'Captura PJE',   value: 45, color: COLORS.medio },
  { label: 'Comunica CNJ',  value: 22, color: COLORS.alto },
  { label: 'Manual',        value: 12, color: COLORS.baixo },
];

const ORIGEM_TOTAL = ORIGEM_DATA.reduce((s, d) => s + d.value, 0);

export function OrigemDistribution() {
  return (
    <WidgetContainer
      title="Origem dos Expedientes"
      icon={FileText}
      subtitle="Últimos 30 dias"
      depth={1}
    >
      <div className="flex items-center gap-5 mt-1">
        <MiniDonut
          segments={ORIGEM_DATA}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(ORIGEM_TOTAL)}
        />
        <div className="flex-1 space-y-2.5">
          {ORIGEM_DATA.map((seg) => {
            const pct = Math.round((seg.value / ORIGEM_TOTAL) * 100);
            return (
              <div key={seg.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[11px] text-muted-foreground/60 truncate">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold">{seg.value}</span>
                  <span className="text-[10px] text-muted-foreground/60">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── 4. Resultado Decisão ────────────────────────────────────────────────
// StackedBar + breakdown mostrando resultado das decisões dos expedientes.

const RESULTADO_DATA = [
  { label: 'Favoravel',             value: 28, color: COLORS.ok },
  { label: 'Parc. Favoravel',       value: 15, color: COLORS.parcial },
  { label: 'Desfavoravel',          value: 8,  color: COLORS.critico },
];

const RESULTADO_TOTAL = RESULTADO_DATA.reduce((s, d) => s + d.value, 0);

export function ResultadoDecisao() {
  return (
    <WidgetContainer
      title="Resultado das Decisões"
      icon={FileText}
      subtitle="Expedientes baixados — mar/2025"
      depth={1}
    >
      <div className="mt-1 mb-3">
        <StackedBar segments={RESULTADO_DATA} height={10} />
      </div>
      <div className="space-y-2.5">
        {RESULTADO_DATA.map((item) => {
          const pct = Math.round((item.value / RESULTADO_TOTAL) * 100);
          return (
            <div key={item.label} className="flex items-center gap-3">
              <ProgressRing
                percent={pct}
                size={36}
                color={item.color}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium leading-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{item.value} expedientes</p>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// ─── 5. Volume Semanal ───────────────────────────────────────────────────
// MiniBar com recebidos (primary) vs baixados (muted) por dia da semana atual.

const VOLUME_DATA = [
  { label: 'Seg', value: 3, value2: 2 },
  { label: 'Ter', value: 5, value2: 4 },
  { label: 'Qua', value: 2, value2: 3 },
  { label: 'Qui', value: 4, value2: 2 },
  { label: 'Sex', value: 1, value2: 1 },
];

export function VolumeSemanal() {
  return (
    <WidgetContainer
      title="Volume Semanal"
      icon={Clock}
      subtitle="Recebidos vs baixados — semana atual"
      depth={1}
    >
      <div className="mt-2">
        <MiniBar
          data={VOLUME_DATA}
          height={64}
          barColor="bg-destructive/50"
          barColor2="bg-primary/30"
        />
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-sm bg-destructive/50" />
          <span className="text-[10px] text-muted-foreground/50">Recebidos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-sm bg-primary/30" />
          <span className="text-[10px] text-muted-foreground/50">Baixados</span>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] text-muted-foreground/60">
            Total:{' '}
            <span className="font-semibold text-foreground/70">
              {fmtNum(VOLUME_DATA.reduce((s, d) => s + d.value, 0))}
            </span>
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── 6. Prazo Medio ──────────────────────────────────────────────────────
// Stat compacto com sparkline de médias semanais e comparação com mês anterior.

const PRAZO_TREND = [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2];

export function PrazoMedio() {
  return (
    <WidgetContainer
      title="Prazo Medio de Resposta"
      icon={AlertTriangle}
      subtitle="Tempo medio entre recebimento e baixa"
      depth={1}
    >
      <div className="flex items-end justify-between gap-4 mt-1">
        <div>
          <Stat
            label="Media atual"
            value="4,2 dias"
            delta="vs. 5,1 dias mes anterior"
            deltaType="positive"
          />
          <div className="mt-3 flex items-center gap-2">
            <UrgencyDot level="ok" />
            <span className="text-[11px] text-muted-foreground/50">
              Reducao de{' '}
              <span className="text-success/70 font-semibold">17,6%</span> em 8 semanas
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Sparkline
            data={PRAZO_TREND}
            width={88}
            height={32}
            color={COLORS.ok}
          />
          <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wide">
            8 semanas
          </span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border/10 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Minimo</p>
          <p className="text-sm font-bold text-success/80">1,0 d</p>
        </div>
        <div className="text-center border-x border-border/10">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Media</p>
          <p className="text-sm font-bold">4,2 d</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Maximo</p>
          <p className="text-sm font-bold text-destructive/80">18,0 d</p>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── 7. Saúde dos Prazos ─────────────────────────────────────────────────
// GaugeMeter hero mostrando score de saúde consolidado dos prazos do escritório.
// Score = 100 - (vencidos * 15) - (vence_hoje * 8) - (proximos_3d * 3)

const SAUDE_PRAZOS_SCORE = 100 - (4 * 15) - (2 * 8) - (5 * 3); // = 54

export function SaudePrazos() {
  return (
    <WidgetContainer
      title="Saúde dos Prazos"
      icon={Activity}
      subtitle="Score consolidado — prazos ativos"
      depth={2}
      className="md:col-span-2"
    >
      <div className="flex flex-col items-center gap-4 mt-1">
        <div className="flex flex-col items-center gap-1">
          <GaugeMeter
            value={SAUDE_PRAZOS_SCORE}
            max={100}
            label="score geral"
            status="warning"
            size={120}
          />
          <p className="text-[10px] text-muted-foreground/60 -mt-1">
            Abaixo de 70 indica atenção necessária
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full pt-3 border-t border-border/10">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Vencidos
            </span>
            <span className="font-display text-xl font-bold text-destructive/80">
              <AnimatedNumber value={4} suffix=" vencidos" className="text-base" />
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border-x border-border/10">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Vencem hoje
            </span>
            <span className="font-display text-xl font-bold text-warning/80">
              <AnimatedNumber value={2} suffix=" hoje" className="text-base" />
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Prazo médio
            </span>
            <span className="font-display text-base font-bold">
              16h 42min
            </span>
          </div>
        </div>

        <InsightBanner type="alert">
          2 expedientes vencem hoje às 18h — Contestação Proc. 0001234 e Recurso Proc. 0009876
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── 8. Calendário de Prazos ─────────────────────────────────────────────
// CalendarHeatmap com densidade de prazos por dia — 5 semanas, escala destrutiva.

// 35 values: 5 weeks × 7 days (Seg–Dom). Zeros nos fins de semana (dias 5 e 6 de cada semana).
const CALENDARIO_DATA = [
  // Semana 1: S T Q Q S S D
  3, 5, 4, 2, 3, 0, 0,
  // Semana 2
  4, 2, 5, 4, 3, 0, 0,
  // Semana 3
  5, 3, 4, 5, 2, 0, 0,
  // Semana 4
  2, 4, 3, 5, 4, 0, 0,
  // Semana 5
  3, 5, 4, 2, 3, 0, 0,
];

export function CalendarioPrazos() {
  return (
    <WidgetContainer
      title="Calendário de Prazos"
      icon={CalendarDays}
      subtitle="Densidade de prazos — últimas 5 semanas"
      depth={1}
    >
      <div className="flex flex-col gap-4 mt-1">
        <CalendarHeatmap data={CALENDARIO_DATA} colorScale="destructive" />

        <div className="pt-3 border-t border-border/10 space-y-2">
          <Stat
            label="Semana mais pesada"
            value="12–16 mar"
            delta="14 prazos nessa semana"
            deltaType="alert"
            small
          />
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Intensidade:
            </span>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-[3px] bg-border/10" />
              <div className="size-3 rounded-[3px] bg-destructive/15" />
              <div className="size-3 rounded-[3px] bg-destructive/30" />
              <div className="size-3 rounded-[3px] bg-destructive/50" />
              <div className="size-3 rounded-[3px] bg-destructive/80" />
            </div>
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[9px] text-muted-foreground/55">Vazio</span>
              <span className="text-[9px] text-muted-foreground/55">→</span>
              <span className="text-[9px] text-destructive/60">Crítico</span>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── 9. Tendência de Responsividade ──────────────────────────────────────
// ComparisonStat 2×2 mostrando métricas operacionais vs mês anterior.
// Para "Backlog" lógica invertida: queda é positiva.

export function TendenciaResponsividade() {
  return (
    <WidgetContainer
      title="Tendência de Responsividade"
      icon={Activity}
      subtitle="Mês atual vs mês anterior"
      depth={1}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-2">
        <ComparisonStat
          label="Tempo de resposta (dias)"
          current={4.2}
          previous={5.1}
          format="number"
        />
        <ComparisonStat
          label="Taxa de cumprimento (%)"
          current={89}
          previous={82}
          format="number"
        />
        <ComparisonStat
          label="Baixados / semana"
          current={12}
          previous={9}
          format="number"
        />
        {/* Backlog: queda é positiva — invertemos current e previous para o sinal */}
        <div className="flex flex-col gap-1">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Backlog atual
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold">14</span>
            <span className="text-[10px] font-medium text-success/70">
              −22,2%
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground/55">anterior: 18</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/10">
        <InsightBanner type="success">
          Tempo de resposta melhorou 18% — ritmo de baixas acelerando
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── Export principal ────────────────────────────────────────────────────

export function ExpedientesWidgets() {
  return (
    <GallerySection
      title="Expedientes"
      description="Prazos processuais, intimações e decisões judiciais — visão consolidada por urgência."
    >
      <UrgencyList />
      <SaudePrazos />
      <AgingFunnel />
      <OrigemDistribution />
      <ResultadoDecisao />
      <VolumeSemanal />
      <PrazoMedio />
      <CalendarioPrazos />
      <TendenciaResponsividade />
    </GallerySection>
  );
}
