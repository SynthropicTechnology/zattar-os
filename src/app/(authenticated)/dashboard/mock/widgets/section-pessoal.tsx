/**
 * WIDGET GALLERY — Seção: Pessoal & Produtividade
 * ============================================================================
 * Widgets do espaço pessoal do advogado: tarefas, lembretes, agenda do dia,
 * chat, produtividade semanal e documentos recentes.
 * Estética "Glass Briefing" — quente, acionável, o "meu espaço".
 *
 * USO: import { PessoalWidgets } from './section-pessoal'
 * ============================================================================
 */

'use client';

import {
  CheckSquare,
  Bell,
  Clock,
  MessageCircle,
  FolderOpen,
  RefreshCw,
  Calendar,
  Gavel,
  FileText,
  FileImage,
  Zap,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  GallerySection,
  WidgetContainer,
  MiniBar,
  MiniDonut,
  Stat,
  UrgencyDot,
  ListItem,
  fmtNum,
  AnimatedNumber,
  CalendarHeatmap,
  GaugeMeter,
  InsightBanner,
  ComparisonStat,
} from './primitives';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MEU_DIA: {
  time: string | null;
  title: string;
  type: 'tarefa' | 'audiencia' | 'lembrete';
  done: boolean;
  next?: boolean;
}[] = [
    { time: '09:00', title: 'Revisar contestação proc. 0024891-12', type: 'tarefa', done: true },
    { time: '09:30', title: 'Audiência — João Ferreira x Metalúrgica SP', type: 'audiencia', done: true },
    { time: '10:30', title: 'Ligar para Dra. Camila sobre recurso', type: 'lembrete', done: true },
    { time: '11:00', title: 'Protocolar impugnação TRT2', type: 'tarefa', done: false, next: true },
    { time: '14:00', title: 'Audiência de conciliação — TRT1', type: 'audiencia', done: false },
    { time: '15:30', title: 'Entregar parecer societário', type: 'lembrete', done: false },
    { time: '17:00', title: 'Fechar relatório mensal de honorários', type: 'tarefa', done: false },
  ];

const TAREFAS_SEGMENTS = [
  { value: 8, color: 'var(--warning)', label: 'Pendentes' },
  { value: 3, color: 'hsl(220 70% 60%)', label: 'Em Andamento' },
  { value: 14, color: 'hsl(142 60% 45%)', label: 'Concluídas' },
];

const PRODUTIVIDADE_SEMANAL = [
  { label: 'Seg', value: 5 },
  { label: 'Ter', value: 7 },
  { label: 'Qua', value: 4 },
  { label: 'Qui', value: 6 },
  { label: 'Sex', value: 3 },
];

const PRODUTIVIDADE_AVG = 5;
const PRODUTIVIDADE_TOTAL = PRODUTIVIDADE_SEMANAL.reduce((s, d) => s + d.value, 0);

const LEMBRETES = [
  { time: '15:00', text: 'Ligação com Dr. Mendes sobre acordo', urgency: 'alto' as const },
  { time: '17:00', text: 'Entregar parecer de rescisão indireta', urgency: 'alto' as const },
  { time: '18:30', text: 'Reunião de equipe — pauta semanal', urgency: 'medio' as const },
  { time: null, text: 'Atualizar senha do e-CAC', urgency: 'baixo' as const },
];

const CAPTURA_TRIBUNAIS: {
  sigla: string;
  nome: string;
  status: 'ok' | 'erro' | 'sincronizando';
}[] = [
    { sigla: 'TRT1', nome: 'Rio de Janeiro', status: 'ok' },
    { sigla: 'TRT2', nome: 'São Paulo', status: 'ok' },
    { sigla: 'TRT3', nome: 'Minas Gerais', status: 'erro' },
    { sigla: 'TRT15', nome: 'Campinas', status: 'sincronizando' },
  ];

const CHAT_SALAS = 4;
const CHAT_NAO_LIDAS = 3;
const CHAT_ULTIMA_MSG = {
  autor: 'Dr. Silva',
  preview: 'Preciso do parecer até sexta, pode ser?',
  tempo: 'há 4 min',
};

const DOCUMENTOS_RECENTES: {
  nome: string;
  tipo: 'doc' | 'pdf';
  tempo: string;
}[] = [
    { nome: 'Contestação_João_Ferreira_v3', tipo: 'doc', tempo: 'há 12 min' },
    { nome: 'Relatório_Honorários_Mar2026', tipo: 'pdf', tempo: 'há 1h' },
    { nome: 'Parecer_Rescisao_Indireta', tipo: 'doc', tempo: 'há 3h' },
  ];

// ─── Mock Data — Novos Widgets ───────────────────────────────────────────────

// Heatmap: 5 semanas x 7 dias de tarefas concluídas (mais recente à direita)
// Padrão: baixo na segunda/sexta/fim de semana, pico na quarta
const HEATMAP_PRODUTIVIDADE: number[] = [
  // Semana 1
  0, 1, 5, 7, 4, 2, 0,
  // Semana 2
  1, 3, 6, 8, 5, 2, 0,
  // Semana 3
  0, 2, 4, 6, 3, 1, 1,
  // Semana 4
  1, 4, 7, 8, 6, 3, 0,
  // Semana 5 (atual — semana incompleta)
  2, 5, 7, 4, 0, 0, 0,
];

const FOCO_HOJE: {
  titulo: string;
  razao: string;
  acao: string;
  urgencia: 'critico' | 'alto' | 'medio';
}[] = [
    {
      titulo: 'Protocolar impugnação TRT2',
      razao: 'Prazo vence hoje às 18h',
      acao: 'Abrir expediente',
      urgencia: 'critico',
    },
    {
      titulo: 'Preparar documentos — Audiência 14h',
      razao: 'Audiência em 2h sem docs preparados',
      acao: 'Ver processo',
      urgencia: 'alto',
    },
    {
      titulo: 'Responder Dr. Silva sobre parecer',
      razao: 'Bloqueando colega desde ontem',
      acao: 'Abrir chat',
      urgencia: 'medio',
    },
  ];

const URGENCIA_COLORS: Record<string, string> = {
  critico: 'bg-destructive text-destructive-foreground',
  alto: 'bg-warning text-warning-foreground',
  medio: 'bg-primary/80 text-primary-foreground',
};

const URGENCIA_RING: Record<string, string> = {
  critico: 'ring-destructive/30',
  alto: 'ring-warning/30',
  medio: 'ring-primary/20',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_ICONS = {
  tarefa: CheckSquare,
  audiencia: Gavel,
  lembrete: Bell,
};

const CAPTURA_STATUS_STYLES: Record<string, string> = {
  ok: 'bg-emerald-500/70',
  erro: 'bg-destructive/80 animate-pulse',
  sincronizando: 'bg-warning/70 animate-pulse',
};

const CAPTURA_STATUS_LABELS: Record<string, string> = {
  ok: 'ok',
  erro: 'erro',
  sincronizando: 'sync',
};

const DOC_ICONS = {
  doc: FileText,
  pdf: FileImage,
};

// ─── Widget NOVO 1: Score Pessoal (Hero, col-span-full) ──────────────────────

export function WidgetScorePessoal() {
  return (
    <WidgetContainer
      title="Briefing do Dia"
      icon={Target}
      subtitle="Sua performance em tempo real — hoje"
      className="md:col-span-3"
      depth={2}
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">

        {/* Gauge compacto */}
        <GaugeMeter value={68} max={100} label="Seu dia" status="warning" size={72} />

        {/* Separador */}
        <div className="hidden sm:block w-px self-stretch bg-border/10" />

        {/* Stats em linha */}
        <div className="flex items-center gap-5 flex-1 min-w-0 flex-wrap">
          {([
            { label: 'Tarefas', val: 18, suffix: '/25', sub: 'concluídas hoje' },
            { label: 'Lembretes', val: 3, suffix: '', sub: 'pendentes' },
            { label: 'Audiências', val: 2, suffix: '', sub: 'hoje' },
            { label: 'Documentos', val: 4, suffix: '', sub: 'editados' },
          ] as const).map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{s.label}</span>
              <span className="font-display text-lg font-bold tabular-nums">
                <AnimatedNumber value={s.val} suffix={s.suffix} />
              </span>
              <span className="text-[9px] text-muted-foreground/55">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Separador */}
        <div className="hidden sm:block w-px self-stretch bg-border/10" />

        {/* Insight compacto */}
        <div className="w-full sm:max-w-56 shrink-0">
          <InsightBanner type="warning">
            Audiência às 14h sem documentos preparados — priorize o preparo.
          </InsightBanner>
        </div>

      </div>
    </WidgetContainer>
  );
}

// ─── Widget NOVO 2: Heatmap de Produtividade ─────────────────────────────────

export function WidgetHeatmapProdutividade() {
  return (
    <WidgetContainer
      title="Histórico de Produtividade"
      icon={BarChart3}
      subtitle="Tarefas concluídas por dia — últimas 5 semanas"
      depth={1}
    >
      {/* Heatmap principal */}
      <div className="flex justify-start mb-4 overflow-x-auto pb-1">
        <CalendarHeatmap
          data={HEATMAP_PRODUTIVIDADE}
          colorScale="success"
        />
      </div>

      {/* Legenda de intensidade */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[9px] text-muted-foreground/55">menos</span>
        {['bg-border/10', 'bg-success/15', 'bg-success/30', 'bg-success/50', 'bg-success/80'].map((c, i) => (
          <div key={i} className={`size-3 rounded-[3px] ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground/55">mais</span>
      </div>

      {/* Métricas abaixo */}
      <div className="pt-3 border-t border-border/10 flex items-start gap-6">
        <ComparisonStat
          label="Média semanal"
          current={23}
          previous={19}
          format="number"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Melhor dia
          </span>
          <span className="font-display text-lg font-bold">Quarta</span>
          <span className="text-[9px] text-muted-foreground/55">avg 5.2 tarefas/dia</span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget NOVO 3: Foco Hoje (Inteligência Preditiva) ───────────────────────

export function WidgetFocoHoje() {
  return (
    <WidgetContainer
      title="Foco Agora"
      icon={Zap}
      subtitle="Próximas ações recomendadas — baseado em IA"
      depth={2}
    >
      <div className="flex flex-col gap-2 mb-4">
        {FOCO_HOJE.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-white/2.5 border border-border/10
                        ring-1 ${URGENCIA_RING[item.urgencia]}
                        hover:bg-white/4 transition-all duration-150 cursor-pointer`}
          >
            {/* Número em círculo */}
            <div
              className={`size-6 rounded-full shrink-0 flex items-center justify-center
                          text-[10px] font-bold ${URGENCIA_COLORS[item.urgencia]}`}
            >
              {i + 1}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground/85 truncate leading-tight">
                {item.titulo}
              </p>
              <p className="text-[9px] text-muted-foreground/45 mt-0.5 truncate">
                {item.razao}
              </p>
            </div>

            {/* Botão de ação */}
            <button
              className={`shrink-0 text-[9px] font-medium px-2 py-1 rounded-lg
                          transition-all duration-150 cursor-pointer
                          ${item.urgencia === 'critico'
                  ? 'bg-destructive/10 text-destructive/70 hover:bg-destructive/15'
                  : item.urgencia === 'alto'
                    ? 'bg-warning/10 text-warning/70 hover:bg-warning/15'
                    : 'bg-primary/10 text-primary/70 hover:bg-primary/15'
                }`}
            >
              {item.acao}
            </button>
          </div>
        ))}
      </div>

      <InsightBanner type="info">
        Baseado em seus prazos, audiências e tarefas pendentes de hoje.
      </InsightBanner>
    </WidgetContainer>
  );
}

// ─── Widget 1: Meu Dia (Timeline) ────────────────────────────────────────────

export function WidgetMeuDia() {
  return (
    <WidgetContainer
      title="Meu Dia"
      icon={Calendar}
      subtitle="Tarefas, lembretes e audiências — hoje"
      depth={2}
      className="md:col-span-2"
    >
      <div className="relative">
        {/* Linha vertical conectora */}
        <div
          className="absolute left-1.75 top-2 bottom-2 w-px bg-border/20"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-0.5">
          {MEU_DIA.map((item, i) => {
            const Icon = TIPO_ICONS[item.type];
            const isNext = item.next === true;

            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-2 py-1.5 rounded-xl transition-all duration-150 ${isNext
                    ? 'bg-primary/[0.07] ring-1 ring-primary/20'
                    : 'hover:bg-white/4'
                  }`}
              >
                {/* Dot no trilho */}
                <div className="relative z-10 mt-0.5 shrink-0">
                  {item.type === 'audiencia' ? (
                    <div
                      className={`size-3.5 rounded-full border-2 flex items-center justify-center ${item.done
                          ? 'border-muted-foreground/20 bg-muted-foreground/20'
                          : isNext
                            ? 'border-primary bg-primary/30'
                            : 'border-primary/50 bg-transparent'
                        }`}
                    >
                      <div className={`size-1.5 rounded-full ${item.done ? 'bg-muted-foreground/30' : isNext ? 'bg-primary' : 'bg-primary/60'}`} />
                    </div>
                  ) : item.type === 'tarefa' ? (
                    <div
                      className={`size-3.5 rounded-sm border flex items-center justify-center ${item.done
                          ? 'border-muted-foreground/20 bg-muted-foreground/15'
                          : isNext
                            ? 'border-primary/60 bg-transparent'
                            : 'border-border/30 bg-transparent'
                        }`}
                    >
                      {item.done && (
                        <div className="size-1.5 rounded-sm bg-muted-foreground/40" />
                      )}
                    </div>
                  ) : (
                    /* lembrete — ponto simples */
                    <div
                      className={`size-2 rounded-full mt-0.5 ${item.done
                          ? 'bg-muted-foreground/25'
                          : isNext
                            ? 'bg-primary shadow-[0_0_6px_var(--glow-primary)]'
                            : 'bg-border/40'
                        }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium truncate flex-1 ${item.done
                          ? 'line-through text-muted-foreground/55'
                          : isNext
                            ? 'text-foreground/90'
                            : 'text-foreground/70'
                        }`}
                    >
                      {item.title}
                    </span>
                    {isNext && (
                      <span className="text-[8px] uppercase tracking-wider text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                        próximo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Icon
                      className={`size-2.5 shrink-0 ${item.done ? 'text-muted-foreground/45' : 'text-muted-foreground/60'
                        }`}
                    />
                    {item.time && (
                      <span
                        className={`text-[9px] tabular-nums ${item.done ? 'text-muted-foreground/50' : 'text-muted-foreground/60'
                          }`}
                      >
                        {item.time}
                      </span>
                    )}
                    <span
                      className={`text-[9px] capitalize ${item.done ? 'text-muted-foreground/45' : 'text-muted-foreground/55'
                        }`}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 2: Tarefas por Status ────────────────────────────────────────────

export function WidgetTarefasStatus() {
  const total = TAREFAS_SEGMENTS.reduce((s, seg) => s + seg.value, 0);
  const concluidas = TAREFAS_SEGMENTS.find((s) => s.label === 'Concluídas')?.value ?? 0;
  const pctConcluidas = Math.round((concluidas / total) * 100);

  return (
    <WidgetContainer
      title="Tarefas por Status"
      icon={CheckSquare}
      subtitle="Distribuição da carteira pessoal"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={TAREFAS_SEGMENTS}
          size={84}
          strokeWidth={11}
          centerLabel={`${fmtNum(total)} total`}
        />
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {TAREFAS_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {seg.label}
              </span>
              <span className="text-[10px] font-semibold tabular-nums">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">Concluídas esta semana</span>
          <span className="text-[11px] font-semibold text-emerald-400/80 tabular-nums">
            {pctConcluidas}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500/50 transition-all duration-700"
            style={{ width: `${pctConcluidas}%` }}
          />
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 3: Produtividade Semanal ─────────────────────────────────────────

export function WidgetProdutividadeSemanal() {
  const maxVal = Math.max(...PRODUTIVIDADE_SEMANAL.map((d) => d.value));
  const avgPct = (PRODUTIVIDADE_AVG / maxVal) * 100;

  return (
    <WidgetContainer
      title="Produtividade Semanal"
      icon={CheckSquare}
      subtitle="Itens concluídos por dia — semana atual"
      depth={1}
    >
      <div className="flex items-end justify-between mb-2">
        <Stat
          label="Total na semana"
          value={fmtNum(PRODUTIVIDADE_TOTAL)}
          delta={`média: ${PRODUTIVIDADE_AVG} / dia`}
          deltaType="neutral"
        />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">melhor dia</span>
          <span className="text-base font-bold tabular-nums">
            {Math.max(...PRODUTIVIDADE_SEMANAL.map((d) => d.value))}
          </span>
          <span className="text-[9px] text-muted-foreground/60">
            {PRODUTIVIDADE_SEMANAL.find((d) => d.value === maxVal)?.label}
          </span>
        </div>
      </div>

      {/* Barras com linha de média */}
      <div className="relative">
        <MiniBar
          data={PRODUTIVIDADE_SEMANAL}
          height={56}
          barColor="bg-primary/50"
        />
        {/* Linha de média */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-warning/30 pointer-events-none"
          style={{ bottom: `${14 + ((avgPct / 100) * 42)}px` }}
          aria-label={`Média: ${PRODUTIVIDADE_AVG}`}
        >
          <span className="absolute -top-2.5 right-0 text-[8px] text-warning/50 tabular-nums">
            méd. {PRODUTIVIDADE_AVG}
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4: Lembretes Ativos ───────────────────────────────────────────────

export function WidgetLembretesAtivos() {
  return (
    <WidgetContainer
      title="Lembretes Ativos"
      icon={Bell}
      subtitle={`${LEMBRETES.length} lembretes para hoje`}
      depth={1}
    >
      <div className="flex flex-col -mx-1">
        {LEMBRETES.map((item, i) => (
          <ListItem key={i}>
            <UrgencyDot level={item.urgency} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground/75 truncate">{item.text}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.time ? (
                <>
                  <Clock className="size-2.5 text-muted-foreground/55" />
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                    {item.time}
                  </span>
                </>
              ) : (
                <span className="text-[9px] text-muted-foreground/55 italic">sem hora</span>
              )}
            </div>
          </ListItem>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          próximo
        </span>
        <span className="text-[10px] text-primary/60 font-medium">
          {LEMBRETES.filter((l) => l.time).sort((a, b) => (a.time! > b.time! ? 1 : -1))[0]?.time}
          {' — '}
          <span className="text-muted-foreground/50">
            {LEMBRETES.filter((l) => l.time).sort((a, b) => (a.time! > b.time! ? 1 : -1))[0]?.text.slice(0, 28)}
            ...
          </span>
        </span>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5: Captura / Status dos Tribunais ─────────────────────────────────

export function WidgetCapturaStatus() {
  const erros = CAPTURA_TRIBUNAIS.filter((t) => t.status === 'erro').length;
  const sincronizando = CAPTURA_TRIBUNAIS.filter((t) => t.status === 'sincronizando').length;

  return (
    <WidgetContainer
      title="Captura — Tribunais"
      icon={RefreshCw}
      subtitle="Status de sincronização automática"
      depth={1}
    >
      {/* Strip de status geral */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-border/10 mb-3">
        <RefreshCw className="size-3 text-muted-foreground/55" />
        <span className="text-[10px] text-muted-foreground/50 flex-1">
          Última sincronização
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums">
          há 2h
        </span>
        {erros > 0 && (
          <UrgencyDot level="critico" />
        )}
      </div>

      {/* Indicadores por tribunal */}
      <div className="flex flex-col gap-1.5">
        {CAPTURA_TRIBUNAIS.map((t) => (
          <div
            key={t.sigla}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/4 transition-all duration-150"
          >
            <div className={`size-2 rounded-full shrink-0 ${CAPTURA_STATUS_STYLES[t.status]}`} />
            <span className="text-[10px] font-semibold text-foreground/70 w-10 shrink-0 tabular-nums">
              {t.sigla}
            </span>
            <span className="text-[10px] text-muted-foreground/45 flex-1 truncate">{t.nome}</span>
            <span
              className={`text-[9px] uppercase tracking-wider font-medium ${t.status === 'ok'
                  ? 'text-emerald-400/60'
                  : t.status === 'erro'
                    ? 'text-destructive/70'
                    : 'text-warning/60'
                }`}
            >
              {CAPTURA_STATUS_LABELS[t.status]}
            </span>
          </div>
        ))}
      </div>

      {(erros > 0 || sincronizando > 0) && (
        <div className="mt-3 pt-2 border-t border-border/10">
          <p className="text-[9px] text-muted-foreground/55">
            {erros > 0 && (
              <span className="text-destructive/50">{erros} tribunal(is) com erro. </span>
            )}
            {sincronizando > 0 && (
              <span className="text-warning/50">{sincronizando} em sincronização.</span>
            )}
          </p>
        </div>
      )}
    </WidgetContainer>
  );
}

// ─── Widget 6: Chat Ativo ─────────────────────────────────────────────────────

export function WidgetChatAtivo() {
  return (
    <WidgetContainer
      title="Chat"
      icon={MessageCircle}
      subtitle="Mensagens e salas ativas"
      depth={1}
    >
      {/* Contador de não lidas */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="size-10 rounded-2xl bg-primary/8er border-primary/15 flex items-center justify-center">
            <MessageCircle className="size-4 text-primary/50" />
          </div>
          {CHAT_NAO_LIDAS > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[8px] font-bold text-background flex items-center justify-center tabular-nums">
              {CHAT_NAO_LIDAS}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/50">Não lidas</p>
          <p className="text-lg font-bold tabular-nums">{CHAT_NAO_LIDAS}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">salas</span>
          <span className="text-base font-bold tabular-nums">{CHAT_SALAS}</span>
          <span className="text-[9px] text-muted-foreground/55">ativas</span>
        </div>
      </div>

      {/* Preview da última mensagem */}
      <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-border/10">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="size-1.5 rounded-full bg-emerald-500/60" />
          <span className="text-[10px] font-semibold text-foreground/70">
            {CHAT_ULTIMA_MSG.autor}
          </span>
          <span className="text-[9px] text-muted-foreground/55 ml-auto tabular-nums">
            {CHAT_ULTIMA_MSG.tempo}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/55 leading-relaxed line-clamp-2">
          {CHAT_ULTIMA_MSG.preview}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          {CHAT_SALAS} salas — {CHAT_NAO_LIDAS} pendentes
        </span>
        <span className="text-[9px] text-primary/50 font-medium">ver todas</span>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 7: Documentos Recentes ────────────────────────────────────────────

export function WidgetDocumentosRecentes() {
  return (
    <WidgetContainer
      title="Documentos Recentes"
      icon={FolderOpen}
      subtitle="Últimas edições — seus arquivos"
      depth={1}
    >
      <div className="flex flex-col gap-0.5 -mx-1">
        {DOCUMENTOS_RECENTES.map((doc, i) => {
          const Icon = DOC_ICONS[doc.tipo];
          return (
            <ListItem key={i}>
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${doc.tipo === 'pdf'
                    ? 'bg-destructive/8 border border-destructive/15'
                    : 'bg-primary/8 border border-primary/15'
                  }`}
              >
                <Icon
                  className={`size-3.5 ${doc.tipo === 'pdf' ? 'text-destructive/50' : 'text-primary/50'
                    }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-foreground/75 truncate">
                  {doc.nome}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  editado {doc.tempo}
                </p>
              </div>
              <span
                className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-medium shrink-0 ${doc.tipo === 'pdf'
                    ? 'text-destructive/50 bg-destructive/6'
                    : 'text-primary/50 bg-primary/6'
                  }`}
              >
                {doc.tipo}
              </span>
            </ListItem>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          {DOCUMENTOS_RECENTES.length} recentes
        </span>
        <span className="text-[9px] text-primary/50 font-medium">abrir todos</span>
      </div>
    </WidgetContainer>
  );
}

// ─── Export principal ────────────────────────────────────────────────────────

export function PessoalWidgets() {
  return (
    <GallerySection
      title="Pessoal & Produtividade"
      description="Seu espaço pessoal — tarefas, agenda do dia, lembretes, chat e documentos recentes."
    >
      {/* Hero: briefing diário com score, stats animados e alerta */}
      <WidgetScorePessoal />

      {/* Linha: meu dia (2 cols) + foco agora */}
      <WidgetMeuDia />
      <WidgetFocoHoje />

      {/* Linha: tarefas + produtividade semanal + heatmap */}
      <WidgetTarefasStatus />
      <WidgetProdutividadeSemanal />
      <WidgetHeatmapProdutividade />

      {/* Linha: lembretes + captura + chat + docs */}
      <WidgetLembretesAtivos />
      <WidgetCapturaStatus />
      <WidgetChatAtivo />
      <WidgetDocumentosRecentes />
    </GallerySection>
  );
}
