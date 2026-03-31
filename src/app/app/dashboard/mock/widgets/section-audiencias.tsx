/**
 * WIDGET GALLERY — Módulo Audiências
 * ============================================================================
 * Seção da galeria de widgets para o módulo de Audiências (Court Hearings).
 * Estética "Glass Briefing" — dados fictícios, compacto, denso em informação.
 * ============================================================================
 */

'use client';

import { Calendar, Clock, MapPin, Gavel, FileText } from 'lucide-react';
import {
  GallerySection,
  WidgetContainer,
  MiniDonut,
  MiniBar,
  Stat,
  ProgressRing,
  CalendarHeatmap,
  InsightBanner,
  ComparisonStat,
  fmtNum,
} from './primitives';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const PROXIMAS_AUDIENCIAS = [
  {
    id: 1,
    date: '31 mar.',
    time: '09:30',
    tipo: 'Instrução',
    processo: '0012345-88.2023.8.26.0100',
    parte: 'Alves & Ferreira Ltda.',
    local: '3ª Vara Cível — SP Capital',
    isNext: true,
    borderColor: 'border-l-primary',
    bgColor: 'bg-primary/[0.06]',
    pillColor: 'bg-primary/15 text-primary',
  },
  {
    id: 2,
    date: '02 abr.',
    time: '14:00',
    tipo: 'Conciliação',
    processo: '0098764-12.2022.8.26.0050',
    parte: 'Roberto C. Mendes',
    local: 'CEJUSC — Fórum Central',
    isNext: false,
    borderColor: 'border-l-[hsl(var(--warning))]',
    bgColor: '',
    pillColor: 'bg-warning/15 text-warning',
  },
  {
    id: 3,
    date: '07 abr.',
    time: '10:15',
    tipo: 'Julgamento',
    processo: '0045231-55.2021.4.03.6100',
    parte: 'Indústrias Paulista S/A',
    local: 'TRF3 — 4ª Turma',
    isNext: false,
    borderColor: 'border-l-destructive',
    bgColor: '',
    pillColor: 'bg-destructive/15 text-destructive',
  },
  {
    id: 4,
    date: '10 abr.',
    time: '11:00',
    tipo: 'UNA',
    processo: '0067890-44.2024.8.26.0196',
    parte: 'Construtora Nova Era',
    local: 'Virtual — Webex',
    isNext: false,
    borderColor: 'border-l-muted-foreground/30',
    bgColor: '',
    pillColor: 'bg-muted-foreground/10 text-muted-foreground/70',
  },
];

const MODALIDADE_SEGMENTS = [
  { value: 18, color: 'hsl(var(--primary))', label: 'Virtual' },
  { value: 12, color: 'hsl(var(--warning))', label: 'Presencial' },
  { value: 5, color: 'hsl(var(--muted-foreground) / 0.55)', label: 'Híbrida' },
];

const STATUS_MENSAL_DATA = [
  { label: 'Out', value: 9, value2: 8, value3: 1 },
  { label: 'Nov', value: 11, value2: 10, value3: 1 },
  { label: 'Dez', value: 7, value2: 6, value3: 1 },
  { label: 'Jan', value: 10, value2: 9, value3: 1 },
  { label: 'Fev', value: 9, value2: 8, value3: 1 },
  { label: 'Mar', value: 8, value2: 7, value3: 1 },
];

const TIPO_BARS = [
  { label: 'Instrução', value: 14, color: 'hsl(var(--primary))' },
  { label: 'Conciliação', value: 8, color: 'hsl(var(--warning))' },
  { label: 'Julgamento', value: 5, color: 'hsl(var(--destructive))' },
  { label: 'UNA', value: 3, color: 'hsl(var(--muted-foreground) / 0.55)' },
  { label: 'Perícia', value: 2, color: 'hsl(var(--primary) / 0.4)' },
];
const TIPO_MAX = Math.max(...TIPO_BARS.map((b) => b.value));

const TREND_MENSAL = [6, 9, 7, 11, 8, 13, 10, 9, 12, 11, 9, 8];

// Heatmap: 5 semanas x 7 dias (Seg→Dom)
// Picos em Ter/Qua/Qui, baixo em Seg/Sex, zero no fim de semana
const HEATMAP_DATA = [
  // Semana 1
  1, 2, 4, 3, 1, 0, 0,
  // Semana 2
  0, 3, 4, 2, 1, 0, 0,
  // Semana 3
  1, 2, 3, 4, 0, 0, 0,
  // Semana 4
  1, 3, 4, 3, 1, 0, 0,
  // Semana 5
  0, 2, 3, 2, 1, 0, 0,
];

const PREPARACAO_ITEMS = [
  {
    nome: 'Instrução — Alves & Ferreira Ltda.',
    tipo: 'Instrução',
    data: '31 mar.',
    preparo: 80,
    statusText: 'Docs prontos',
    statusColor: 'text-success/70',
    ringColor: 'hsl(var(--success))',
  },
  {
    nome: 'Conciliação — Roberto C. Mendes',
    tipo: 'Conciliação',
    data: '02 abr.',
    preparo: 45,
    statusText: 'Faltam 2 docs',
    statusColor: 'text-warning/70',
    ringColor: 'hsl(var(--warning))',
  },
  {
    nome: 'Julgamento — Indústrias Paulista S/A',
    tipo: 'Julgamento',
    data: '07 abr.',
    preparo: 0,
    statusText: 'Sem preparo',
    statusColor: 'text-destructive/70',
    ringColor: 'hsl(var(--destructive))',
  },
];

// ─── Widget 1 — Próximas Audiências (Timeline) ───────────────────────────────

export function ProximasAudiencias() {
  return (
    <WidgetContainer
      title="Próximas Audiências"
      icon={Calendar}
      subtitle="Agenda dos próximos 30 dias"
      className="md:col-span-2"
    >
      <div className="space-y-2">
        {PROXIMAS_AUDIENCIAS.map((a) => (
          <div
            key={a.id}
            className={`
              border-l-2 pl-3 py-2 rounded-r-lg transition-colors duration-150
              ${a.borderColor}
              ${a.isNext ? `${a.bgColor} border rounded-lg border-border/20 pr-2` : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${a.pillColor}`}
                  >
                    {a.tipo}
                  </span>
                  {a.isNext && (
                    <span className="text-[9px] font-medium text-primary/70 uppercase tracking-wider">
                      Próxima
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium mt-1 truncate">{a.parte}</p>
                <p className="text-[9px] text-muted-foreground/60 font-mono truncate">
                  {a.processo}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground/60">
                  <Calendar className="size-2.5" />
                  <span>{a.date}</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground/50 mt-0.5">
                  <Clock className="size-2.5" />
                  <span>{a.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground/60">
              <MapPin className="size-2.5 shrink-0" />
              <span className="truncate">{a.local}</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 2 — Modalidade Distribution (MiniDonut) ──────────────────────────

export function ModalidadeDistribution() {
  const total = MODALIDADE_SEGMENTS.reduce((acc, s) => acc + s.value, 0);

  return (
    <WidgetContainer
      title="Modalidade"
      icon={Gavel}
      subtitle="Distribuição por formato"
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <MiniDonut
          segments={MODALIDADE_SEGMENTS}
          size={110}
          strokeWidth={14}
          centerLabel={`${fmtNum(total)}`}
        />
        <div className="w-full space-y-3">
          {MODALIDADE_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs text-muted-foreground/60 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="text-right shrink-0 flex items-baseline gap-1.5">
                <span className="text-sm font-semibold font-display">{seg.value}</span>
                <span className="text-[10px] text-muted-foreground/60">
                  {Math.round((seg.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full pt-2 border-t border-border/15">
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <span>TOTAL</span>
            <span className="font-semibold text-foreground/60">{fmtNum(total)}</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 3 — Status Mensal (MiniBar grouped) ───────────────────────────────

export function StatusMensal() {
  return (
    <WidgetContainer
      title="Status Mensal"
      subtitle="Últ. 6 meses — Marcadas vs Realizadas vs Canceladas"
    >
      <div className="space-y-3">
        <MiniBar
          data={STATUS_MENSAL_DATA}
          height={56}
          barColor="bg-primary/50"
          barColor2="bg-[hsl(var(--warning)/0.5)]"
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-primary/50" />
            <span className="text-[9px] text-muted-foreground/50">Marcadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-[hsl(var(--warning)/0.5)]" />
            <span className="text-[9px] text-muted-foreground/50">Realizadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-destructive/30" />
            <span className="text-[9px] text-muted-foreground/50">Canceladas</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/15">
          {STATUS_MENSAL_DATA.slice(-3).map((d) => (
            <div key={d.label} className="text-center">
              <p className="text-[10px] font-display font-bold">{d.value}</p>
              <p className="text-[9px] text-muted-foreground/60">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4 — KPI Strip ────────────────────────────────────────────────────

export function KpiStrip() {
  return (
    <WidgetContainer title="Resumo do Período" subtitle="Março 2026">
      <div className="grid grid-cols-3 gap-3">
        {/* KPI 1 */}
        <div className="flex flex-col gap-1">
          <Stat label="Este Mês" value="8" delta="+1 vs fev." deltaType="positive" small />
        </div>
        {/* KPI 2 */}
        <div className="flex flex-col gap-1">
          <Stat label="Próx. 7 dias" value="3" delta="2 virtual" deltaType="neutral" small />
        </div>
        {/* KPI 3 — com ProgressRing */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider self-start">
            Comparecimento
          </p>
          <ProgressRing
            percent={94}
            size={44}
            color="hsl(var(--primary))"
          />
          <p className="text-[9px] text-muted-foreground/60">de 8 aud.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-border/15">
        <div>
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Adiamentos
          </p>
          <p className="text-sm font-display font-bold mt-0.5">
            2{' '}
            <span className="text-[10px] font-normal text-muted-foreground/60">este mês</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Duração Média
          </p>
          <p className="text-sm font-display font-bold mt-0.5">
            47{' '}
            <span className="text-[10px] font-normal text-muted-foreground/60">min</span>
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5 — Audiências por Tipo (Horizontal Bars) ────────────────────────

export function AudienciasPorTipo() {
  return (
    <WidgetContainer title="Por Tipo" icon={Gavel} subtitle="Distribuição histórica">
      <div className="space-y-2.5">
        {TIPO_BARS.map((bar) => (
          <div key={bar.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">{bar.label}</span>
              <span className="text-[10px] font-semibold font-display">{bar.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(bar.value / TIPO_MAX) * 100}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-border/15 flex justify-between text-[9px] text-muted-foreground/60">
          <span>TOTAL</span>
          <span className="font-semibold text-foreground/50">
            {fmtNum(TIPO_BARS.reduce((acc, b) => acc + b.value, 0))} audiências
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 6 — Trend Mensal (Sparkline/MiniArea) ────────────────────────────

export function TrendMensal() {
  const months = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];
  const currentVal = TREND_MENSAL[TREND_MENSAL.length - 1];
  const prevVal = TREND_MENSAL[TREND_MENSAL.length - 2];
  const delta = currentVal - prevVal;
  const deltaType = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} vs mês anterior`;

  return (
    <WidgetContainer
      title="Tendência Anual"
      subtitle="Abr 2025 — Mar 2026"
    >
      <div className="flex items-start justify-between mb-3">
        <Stat
          label="Março 2026"
          value={currentVal}
          delta={deltaLabel}
          deltaType={deltaType}
          small
        />
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Média</p>
          <p className="text-sm font-display font-bold mt-0.5">
            {(TREND_MENSAL.reduce((a, b) => a + b, 0) / TREND_MENSAL.length).toFixed(1)}
          </p>
          <p className="text-[9px] text-muted-foreground/60">por mês</p>
        </div>
      </div>

      {/* Inline SVG area chart with highlighted last month */}
      <TrendAreaChart data={TREND_MENSAL} />

      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-muted-foreground/60">{months[0]}</span>
        <span className="text-[9px] text-primary/60 font-medium">{months[months.length - 1]}</span>
      </div>
    </WidgetContainer>
  );
}

function TrendAreaChart({ data }: { data: number[] }) {
  const width = 220;
  const height = 52;
  const min = Math.min(...data) * 0.85;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));

  const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPts = `0,${height} ${linePts} ${width},${height}`;

  const lastPt = pts[pts.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="aud-trend-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#aud-trend-grad)" />
      <polyline
        points={linePts}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {/* Highlight current month dot */}
      <circle cx={lastPt.x} cy={lastPt.y} r="4" fill="hsl(var(--primary))" className="opacity-90" />
      <circle cx={lastPt.x} cy={lastPt.y} r="7" fill="hsl(var(--primary))" className="opacity-15" />
      {/* Value label above last dot */}
      <text
        x={lastPt.x}
        y={lastPt.y - 9}
        textAnchor="middle"
        fontSize="9"
        fill="hsl(var(--primary))"
        fontWeight="600"
        className="opacity-80"
      >
        {data[data.length - 1]}
      </text>
    </svg>
  );
}

// ─── Widget 7 — Comparativo Mensal (ComparisonStat + InsightBanner) ──────────

export function WidgetComparativoMensal() {
  return (
    <WidgetContainer
      title="Comparativo Mensal"
      subtitle="Março vs Fevereiro 2026"
      className="md:col-span-2"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 pb-4">
        <ComparisonStat
          label="Realizadas"
          current={7}
          previous={8}
          format="number"
        />
        <ComparisonStat
          label="Canceladas"
          current={1}
          previous={3}
          format="number"
        />
        <ComparisonStat
          label="Taxa de sucesso"
          current={87.5}
          previous={72.7}
          format="percent"
        />
        <ComparisonStat
          label="Duração média"
          current={47}
          previous={52}
          format="number"
        />
      </div>
      <InsightBanner type="success">
        Taxa de cancelamento caiu 66% — melhor mês do trimestre
      </InsightBanner>
    </WidgetContainer>
  );
}

// ─── Widget 8 — Heatmap Semanal (CalendarHeatmap) ────────────────────────────

export function WidgetHeatmapSemanal() {
  return (
    <WidgetContainer
      title="Densidade Semanal"
      subtitle="Audiências por dia — últimas 5 semanas"
    >
      <div className="flex flex-col gap-4">
        <CalendarHeatmap data={HEATMAP_DATA} colorScale="warning" />
        <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-border/15">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Dia mais cheio
            </span>
            <span className="text-[10px] font-semibold text-foreground/70">
              Quarta (média 3.2)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Horário pico
            </span>
            <span className="text-[10px] font-semibold text-foreground/70">
              14h–16h
            </span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 9 — Preparação de Audiências (ProgressRing + InsightBanner) ──────

export function WidgetPreparacao() {
  return (
    <WidgetContainer
      title="Preparação"
      icon={FileText}
      subtitle="Status documental das próximas audiências"
    >
      <div className="space-y-3 mb-4">
        {PREPARACAO_ITEMS.map((item) => (
          <div
            key={item.nome}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/4 transition-colors duration-150"
          >
            <ProgressRing
              percent={item.preparo}
              size={32}
              color={item.ringColor}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium truncate leading-tight">{item.nome}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-medium ${item.statusColor}`}>
                  {item.statusText}
                </span>
                <span className="text-[9px] text-muted-foreground/55">·</span>
                <span className="text-[9px] text-muted-foreground/60">{item.data}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <InsightBanner type="warning">
        Audiência de Julgamento em 7 dias sem documentos preparados
      </InsightBanner>
    </WidgetContainer>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function AudienciasWidgets() {
  return (
    <GallerySection
      title="Audiências"
      description="Visualizações para gestão de pautas, modalidades e tendências de audiências judiciais."
    >
      <ProximasAudiencias />
      <ModalidadeDistribution />
      <StatusMensal />
      <KpiStrip />
      <AudienciasPorTipo />
      <TrendMensal />
      <WidgetComparativoMensal />
      <WidgetHeatmapSemanal />
      <WidgetPreparacao />
    </GallerySection>
  );
}
