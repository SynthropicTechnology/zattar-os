/**
 * WIDGET GALLERY — Seção: Contratos & Obrigações
 * ============================================================================
 * Widgets de visualização do módulo de Contratos e Obrigações (acordos jurídicos).
 * Estética "Glass Briefing" — painel escuro, bordas sutis, dados compactos.
 * Módulo na interseção jurídico-financeiro: urgência + controle de repasse.
 *
 * USO: import { ContratosObrigacoesWidgets } from './section-contratos'
 * ============================================================================
 */

'use client';

import { FileText, Scale, Wallet, BarChart3, ArrowLeftRight, Activity, HeartPulse, PieChart } from 'lucide-react';
import {
  GallerySection,
  WidgetContainer,
  MiniDonut,
  StackedBar,
  Stat,
  ProgressRing,
  UrgencyDot,
  ListItem,
  MiniBar,
  GaugeMeter,
  InsightBanner,
  Treemap,
  ComparisonStat,
  fmtMoeda,
  fmtNum,
  fmtData,
} from './primitives';

// ─── Mock Data ───────────────────────────────────────────────────────────────

// Widget 1 — Contratos por Status
const STATUS_CONTRATOS = [
  { value: 5,  color: 'hsl(220 70% 60%)',              label: 'Em Contratação' },
  { value: 18, color: 'hsl(var(--primary))',            label: 'Contratado' },
  { value: 42, color: 'hsl(142 60% 45%)',              label: 'Distribuído' },
  { value: 3,  color: 'hsl(var(--destructive) / 0.7)', label: 'Desistência' },
];

// Widget 2 — Contratos por Tipo
const TIPOS_CONTRATO = [
  { label: 'Ajuizamento',   value: 24 },
  { label: 'Defesa',        value: 18 },
  { label: 'Assessoria',    value: 12 },
  { label: 'Consultoria',   value: 8  },
  { label: 'Parecer',       value: 4  },
  { label: 'Extrajudicial', value: 2  },
];
const TIPOS_MAX = TIPOS_CONTRATO[0].value;

// Widget 3 — Obrigações a Vencer
type ObrigacaoLevel = 'critico' | 'alto' | 'medio' | 'baixo';
type ObrigacaoBadge = 'Acordo' | 'Condenação' | 'Custas';

const OBRIGACOES: {
  descricao: string;
  valor: number;
  vencimento: string;
  urgencia: ObrigacaoLevel;
  tipo: ObrigacaoBadge;
}[] = [
  {
    descricao: 'Parcela acordo trabalhista — Silva & Cia',
    valor: 14800,
    vencimento: '2026-04-02',
    urgencia: 'critico',
    tipo: 'Acordo',
  },
  {
    descricao: 'Pagamento custas recursais — TRT3',
    valor: 3240,
    vencimento: '2026-04-07',
    urgencia: 'alto',
    tipo: 'Custas',
  },
  {
    descricao: 'Condenação em danos morais — Proc. 0014732',
    valor: 28500,
    vencimento: '2026-04-15',
    urgencia: 'medio',
    tipo: 'Condenação',
  },
  {
    descricao: 'Parcela final acordo extrajudicial — Gonçalves',
    valor: 9600,
    vencimento: '2026-04-28',
    urgencia: 'baixo',
    tipo: 'Acordo',
  },
];

const BADGE_STYLES: Record<ObrigacaoBadge, string> = {
  'Acordo':     'bg-primary/10 text-primary/80',
  'Condenação': 'bg-destructive/10 text-destructive/70',
  'Custas':     'bg-warning/10 text-warning/80',
};

// Widget 4 — Parcelas Status
const PARCELAS_SEGMENTS = [
  { value: 45, color: 'hsl(142 60% 45%)',   label: 'Pagas' },
  { value: 12, color: 'hsl(var(--warning))', label: 'Pendentes' },
  { value: 3,  color: 'hsl(var(--destructive))', label: 'Atrasadas' },
];
const PARCELAS_TOTAL    = 124800;
const PARCELAS_PENDENTE = 18200;
const PARCELAS_TOTAL_N  = PARCELAS_SEGMENTS.reduce((a, s) => a + s.value, 0);

// Widget 5 — Repasses Pendentes
type RepasseStatus = 'pendente_declaração' | 'pendente_transferência' | 'repassado';

const REPASSES: {
  processo: string;
  cliente: string;
  total: number;
  pctCliente: number;
  pctEscritorio: number;
  status: RepasseStatus;
}[] = [
  {
    processo: '0021-45.2023.5.03.0012',
    cliente: 'Metalúrgica Estrela Ltda',
    total: 84000,
    pctCliente: 70,
    pctEscritorio: 30,
    status: 'pendente_declaração',
  },
  {
    processo: '0008-19.2022.5.01.0055',
    cliente: 'Transportes Vitória S/A',
    total: 52500,
    pctCliente: 70,
    pctEscritorio: 30,
    status: 'pendente_transferência',
  },
  {
    processo: '0034-02.2021.5.15.0033',
    cliente: 'Comércio Almeida ME',
    total: 31200,
    pctCliente: 70,
    pctEscritorio: 30,
    status: 'repassado',
  },
];

const REPASSE_STATUS_STYLES: Record<RepasseStatus, { label: string; className: string }> = {
  pendente_declaração:  { label: 'Decl. Pendente', className: 'bg-destructive/10 text-destructive/70' },
  pendente_transferência: { label: 'Transf. Pendente', className: 'bg-warning/10 text-warning/80' },
  repassado:            { label: 'Repassado',      className: 'bg-success/10 text-success/70' },
};

// Widget 7 — Saúde Contratual (hero)
const SAUDE_COMPARACOES = [
  { label: 'Novos contratos',    current: 5,       previous: 3,      format: 'number'   as const },
  { label: 'Valor em carteira',  current: 1230000, previous: 980000, format: 'currency' as const },
  { label: 'Taxa inadimplência', current: 8,       previous: 12,     format: 'percent'  as const },
];

// Widget 8 — Obrigações Treemap
const TREEMAP_OBRIGACOES = [
  { value: 245000, label: 'Acordos Trabalhistas', color: 'hsl(var(--primary) / 0.70)'     },
  { value: 180000, label: 'Condenações',          color: 'hsl(var(--destructive) / 0.65)' },
  { value: 42000,  label: 'Custas Processuais',   color: 'hsl(var(--warning) / 0.65)'     },
  { value: 28000,  label: 'Honorários Periciais', color: 'hsl(var(--primary) / 0.35)'     },
];
const TREEMAP_TOTAL = TREEMAP_OBRIGACOES.reduce((a, s) => a + s.value, 0);

// Widget 6 — Modelo de Cobrança
const COBRANCA_BAR_DATA = [
  { label: 'Jan', value: 28000, value2: 64000 },
  { label: 'Fev', value: 31000, value2: 71000 },
  { label: 'Mar', value: 34000, value2: 89000 },
];
const REALIZACAO_RATE = 62;

// ─── Widget 1: Contratos por Status ─────────────────────────────────────────

export function WidgetStatusContratos() {
  const total = STATUS_CONTRATOS.reduce((a, s) => a + s.value, 0);

  return (
    <WidgetContainer
      title="Contratos por Status"
      icon={FileText}
      subtitle="Distribuição da carteira de contratos"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={STATUS_CONTRATOS}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {STATUS_CONTRATOS.map((seg) => (
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

// ─── Widget 2: Contratos por Tipo ────────────────────────────────────────────

export function WidgetTiposContrato() {
  return (
    <WidgetContainer
      title="Contratos por Tipo"
      icon={Scale}
      subtitle="Volume por modalidade contratual"
      depth={1}
    >
      <div className="flex flex-col gap-2.5">
        {TIPOS_CONTRATO.map((tipo) => {
          const pct = Math.round((tipo.value / TIPOS_MAX) * 100);
          return (
            <div key={tipo.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground/70 truncate leading-none">
                  {tipo.label}
                </span>
                <span className="text-[10px] font-semibold tabular-nums ml-2 shrink-0">
                  {tipo.value}
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

// ─── Widget 3: Obrigações a Vencer ───────────────────────────────────────────

export function WidgetObrigacoesVencer() {
  return (
    <WidgetContainer
      title="Obrigações a Vencer"
      icon={Wallet}
      subtitle="Ordenado por urgência — próximos 30 dias"
      depth={1}
      className="md:col-span-2"
    >
      <div className="flex flex-col -mx-1">
        {OBRIGACOES.map((ob) => (
          <ListItem key={ob.descricao}>
            <UrgencyDot level={ob.urgencia} />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground/80 truncate leading-tight">
                {ob.descricao}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] px-1.5 py-px rounded-full font-medium ${BADGE_STYLES[ob.tipo]}`}
                >
                  {ob.tipo}
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  vence {fmtData(ob.vencimento)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold tabular-nums shrink-0 text-right">
              {fmtMoeda(ob.valor)}
            </span>
          </ListItem>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4: Parcelas Status ────────────────────────────────────────────────

export function WidgetParcelasStatus() {
  return (
    <WidgetContainer
      title="Parcelas — Status"
      icon={BarChart3}
      subtitle={`${fmtNum(PARCELAS_TOTAL_N)} parcelas no periodo`}
      depth={1}
    >
      <StackedBar segments={PARCELAS_SEGMENTS} height={10} />

      <div className="flex gap-2 mt-3 mb-4">
        {PARCELAS_SEGMENTS.map((seg) => {
          const pct = Math.round((seg.value / PARCELAS_TOTAL_N) * 100);
          return (
            <div key={seg.label} className="flex items-center gap-1.5 flex-1">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground/50 truncate">{seg.label}</p>
                <p className="text-[10px] font-semibold tabular-nums">{seg.value}</p>
                <p className="text-[9px] text-muted-foreground/60 tabular-nums">{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/10 pt-3 grid grid-cols-2 gap-3">
        <Stat
          label="Total Periodo"
          value={fmtMoeda(PARCELAS_TOTAL)}
          deltaType="neutral"
          small
        />
        <Stat
          label="Valor Pendente"
          value={fmtMoeda(PARCELAS_PENDENTE)}
          delta={`${Math.round((PARCELAS_PENDENTE / PARCELAS_TOTAL) * 100)}% do total`}
          deltaType="alert"
          small
        />
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5: Repasses Pendentes ────────────────────────────────────────────

export function WidgetRepassesPendentes() {
  return (
    <WidgetContainer
      title="Repasses Pendentes"
      icon={ArrowLeftRight}
      subtitle="Divisão cliente / escritório"
      depth={1}
    >
      <div className="flex flex-col -mx-1">
        {REPASSES.map((rep) => {
          const statusInfo = REPASSE_STATUS_STYLES[rep.status];
          const valorCliente    = rep.total * (rep.pctCliente / 100);
          const valorEscritorio = rep.total * (rep.pctEscritorio / 100);
          return (
            <ListItem key={rep.processo}>
              <div className="flex flex-col flex-1 min-w-0 gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground/80 truncate flex-1">
                    {rep.cliente}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-px rounded-full font-medium shrink-0 ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/55 font-mono truncate">
                  {rep.processo}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/60">Cliente</span>
                    <span className="text-[9px] font-semibold text-primary/70 tabular-nums">
                      {fmtMoeda(valorCliente)}
                    </span>
                    <span className="text-[8px] text-muted-foreground/55">
                      ({rep.pctCliente}%)
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/45">·</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/60">Escrit.</span>
                    <span className="text-[9px] font-semibold tabular-nums text-muted-foreground/60">
                      {fmtMoeda(valorEscritorio)}
                    </span>
                    <span className="text-[8px] text-muted-foreground/55">
                      ({rep.pctEscritorio}%)
                    </span>
                  </div>
                </div>
              </div>
            </ListItem>
          );
        })}
      </div>

      <div className="border-t border-border/10 mt-1 pt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Total pendente de repasse
          </span>
          <span className="text-[10px] font-bold tabular-nums text-warning/80">
            {fmtMoeda(
              REPASSES.filter((r) => r.status !== 'repassado').reduce(
                (a, r) => a + r.total * (r.pctCliente / 100),
                0,
              ),
            )}
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 6: Modelo de Cobrança ─────────────────────────────────────────────

export function WidgetModeloCobranca() {
  return (
    <WidgetContainer
      title="Modelo de Cobrança"
      icon={Activity}
      subtitle="Pro Labore vs. Pro Exito — Mar 2026"
      depth={2}
    >
      {/* Comparação em duas colunas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Pro Labore */}
        <div className="rounded-xl border border-border/15 bg-white/2 p-3">
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">
            Pro Labore
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground/80 mb-2">
            28 contratos
          </p>
          <Stat
            label="Faturado"
            value="R$ 340k"
            delta="receita garantida"
            deltaType="positive"
            small
          />
        </div>

        {/* Pro Êxito */}
        <div className="rounded-xl border border-primary/10 bg-primary/3 p-3">
          <p className="text-[9px] text-primary/50 uppercase tracking-wider mb-1">
            Pro Exito
          </p>
          <p className="text-[10px] font-semibold text-primary/70 mb-2">
            40 contratos
          </p>
          <Stat
            label="Potencial"
            value="R$ 890k"
            delta="depende de resultado"
            deltaType="alert"
            small
          />
        </div>
      </div>

      {/* Taxa de Realização + mini bar trend */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/10 mb-4">
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={REALIZACAO_RATE}
            size={52}
            color="hsl(220 70% 60%)"
          />
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Taxa de Realizacao
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              exito efetivamente cobrado
            </p>
          </div>
        </div>
      </div>

      {/* Trend bar: pro labore vs pro êxito por mês */}
      <div>
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-2">
          Receita realizada — ultimos 3 meses
        </p>
        <MiniBar
          data={COBRANCA_BAR_DATA}
          height={52}
          barColor="bg-muted-foreground/30"
          barColor2="bg-primary/50"
        />
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-muted-foreground/30" />
            <span className="text-[9px] text-muted-foreground/60">Pro Labore</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-primary/50" />
            <span className="text-[9px] text-muted-foreground/60">Pro Exito</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 7: Saúde Contratual ───────────────────────────────────────────────

export function WidgetSaudeContratual() {
  return (
    <WidgetContainer
      title="Saúde Contratual"
      icon={HeartPulse}
      subtitle="Score composto — distribuição, adimplência e repasses"
      depth={2}
      className="md:col-span-2"
    >
      {/* Gauge + comparações lado a lado */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Gauge central */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <GaugeMeter
            value={72}
            max={100}
            label="/ 100"
            status="good"
            size={110}
          />
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1">
            Score contratual
          </p>
        </div>

        {/* Divisor vertical (visível em sm+) */}
        <div className="hidden sm:block w-px self-stretch bg-border/10" />

        {/* Comparações */}
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-4 justify-center sm:justify-start pt-1">
          {SAUDE_COMPARACOES.map((s) => (
            <ComparisonStat
              key={s.label}
              label={s.label}
              current={s.current}
              previous={s.previous}
              format={s.format}
            />
          ))}
        </div>
      </div>

      {/* Insight banner */}
      <div className="mt-4">
        <InsightBanner type="info">
          3 contratos em fase de contratação há 30+ dias — considere follow-up com os clientes.
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 8: Obrigações Treemap ─────────────────────────────────────────────

export function WidgetObrigacoesTreemap() {
  return (
    <WidgetContainer
      title="Distribuição de Obrigações"
      icon={PieChart}
      subtitle="Por natureza jurídica — valor acumulado"
      depth={1}
    >
      <Treemap segments={TREEMAP_OBRIGACOES} height={90} />

      {/* Legenda compacta */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {TREEMAP_OBRIGACOES.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[9px] text-muted-foreground/50">{seg.label}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <p className="text-[10px] text-muted-foreground/50 mt-3 tabular-nums">
        {fmtMoeda(TREEMAP_TOTAL)} em obrigações ativas
      </p>

      {/* Insight */}
      <div className="mt-2">
        <InsightBanner type="warning">
          {fmtMoeda(18200)} em parcelas atrasadas — 3 processos precisam de atenção.
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function ContratosObrigacoesWidgets() {
  return (
    <GallerySection
      title="Contratos & Obrigações"
      description="Visualizações do módulo contratual e de obrigações — status, tipo, vencimentos, parcelas e modelos de cobrança."
    >
      <WidgetSaudeContratual />
      <WidgetStatusContratos />
      <WidgetTiposContrato />
      <WidgetObrigacoesVencer />
      <WidgetParcelasStatus />
      <WidgetRepassesPendentes />
      <WidgetObrigacoesTreemap />
      <WidgetModeloCobranca />
    </GallerySection>
  );
}
