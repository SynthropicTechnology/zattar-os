'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  FileText,
  Wallet,
  ArrowRight,
  Clock,
  MapPin,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Zap,
} from 'lucide-react';

// ============================================================================
// DASHBOARD MOCK v2 — "The Glass Briefing"
// ============================================================================
// Conceito: Prioridade como princípio organizador, não categoria.
// Não é "seus dados" — é "o que você deve fazer agora."
// Acesse em: /app/dashboard/mock
// ============================================================================

// ─── Mock data ──────────────────────────────────────────────────────────

const MOCK = {
  nome: 'Jordan',
  proximaAcao: {
    tipo: 'Audiência de Instrução',
    processo: '0001234-56.2024.5.01.0001',
    local: '2ª Vara do Trabalho — Rio de Janeiro',
    parte: 'Silva & Associados vs. Tech Corp',
    dataHora: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000), // +2h14m from now
  },
  pulse: {
    processos: { valor: 127, trend: [3, 4, 2, 5, 4, 6, 7], delta: '+3 esta semana' },
    expedientes: { valor: 14, trend: [8, 7, 5, 6, 4, 3, 2], delta: '2 vencidos', alerta: true },
    saldo: { valor: 124350.8, trend: [98, 105, 101, 112, 108, 118, 124], delta: '+12% mês' },
  },
  atencao: [
    { id: 1, tipo: 'expediente', titulo: 'Recurso Ordinário — Proc. 0009876', detalhe: 'Venceu ontem', urgencia: 'critico', prazo: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: 2, tipo: 'expediente', titulo: 'Contestação — Proc. 0001234', detalhe: 'Vence hoje às 18h', urgencia: 'alto', prazo: new Date() },
    { id: 3, tipo: 'obrigacao', titulo: 'Custas processuais — Proc. 0004567', detalhe: 'R$ 1.250 em 5 dias', urgencia: 'medio', prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { id: 4, tipo: 'audiencia', titulo: 'Conciliação — 5ª Vara Cível SP', detalhe: 'Amanhã às 10:30', urgencia: 'medio', prazo: new Date(Date.now() + 26 * 60 * 60 * 1000) },
    { id: 5, tipo: 'expediente', titulo: 'Petição Inicial — Proc. 0007890', detalhe: 'Em 3 dias', urgencia: 'baixo', prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { id: 6, tipo: 'obrigacao', titulo: 'Honorários periciais — Proc. 0009876', detalhe: 'R$ 3.500 em 10 dias', urgencia: 'baixo', prazo: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  ],
  meuDia: [
    { hora: '09:00', titulo: 'Revisar petição do caso Silva', tipo: 'tarefa', done: true },
    { hora: '10:30', titulo: 'Audiência de Instrução — 2ª VT/RJ', tipo: 'audiencia', done: false },
    { hora: '12:00', titulo: 'Almoço com Dr. Mendes', tipo: 'lembrete', done: false },
    { hora: '14:00', titulo: 'Audiência de Conciliação — 5ª VC/SP', tipo: 'audiencia', done: false },
    { hora: '15:00', titulo: 'Preparar documentos para perícia', tipo: 'tarefa', done: false },
    { hora: '15:30', titulo: 'Enviar contrato revisado', tipo: 'tarefa', done: false },
    { hora: '17:00', titulo: 'Entregar parecer — Construtora ABC', tipo: 'lembrete', done: false },
  ],
  financeiro: {
    receita: [45, 52, 48, 61, 55, 67.5],
    despesa: [32, 38, 41, 35, 42, 32.1],
    pagar: { valor: 32100, qtd: 8 },
    receber: { valor: 67500, qtd: 12 },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Countdown hook ─────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, total: diff };
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────

function Sparkline({ data, alert = false }: { data: number[]; alert?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={alert ? 'var(--destructive)' : 'var(--primary)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / range) * h}
          r="3"
          fill={alert ? 'var(--destructive)' : 'var(--primary)'}
        />
      )}
    </svg>
  );
}

// ─── Glass primitives ───────────────────────────────────────────────────

function GlassPanel({
  children,
  className = '',
  depth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: 1 | 2 | 3;
}) {
  const depthStyles = {
    1: 'glass-widget bg-transparent border-border/20',
    2: 'glass-kpi bg-transparent border-border/30',
    3: 'bg-primary/[0.04] backdrop-blur-xl border-primary/10',
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${depthStyles[depth]} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Urgency indicator ──────────────────────────────────────────────────

function UrgencyDot({ level }: { level: string }) {
  const styles: Record<string, string> = {
    critico: 'bg-destructive shadow-[0_0_8px_var(--glow-destructive)] animate-pulse',
    alto: 'bg-warning shadow-[0_0_6px_var(--glow-warning)]',
    medio: 'bg-primary/50',
    baixo: 'bg-muted-foreground/30',
  };
  return <div className={`size-2 rounded-full shrink-0 ${styles[level] || styles.baixo}`} />;
}

// ─── Type badge ─────────────────────────────────────────────────────────

function TypeBadge({ tipo }: { tipo: string }) {
  const labels: Record<string, { text: string; style: string }> = {
    expediente: { text: 'Expediente', style: 'text-warning/70 bg-warning/[0.08]' },
    audiencia: { text: 'Audiência', style: 'text-info/70 bg-info/[0.08]' },
    obrigacao: { text: 'Obrigação', style: 'text-primary/70 bg-primary/[0.08]' },
  };
  const l = labels[tipo] || labels.expediente;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${l.style}`}>
      {l.text}
    </span>
  );
}

// ─── Timeline item type icon ────────────────────────────────────────────

function TimelineIcon({ tipo, done }: { tipo: string; done: boolean }) {
  if (done) {
    return (
      <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
        <svg viewBox="0 0 12 12" className="size-2.5 text-primary">
          <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  const styles: Record<string, string> = {
    audiencia: 'border-info/40 text-info',
    tarefa: 'border-border/40 text-muted-foreground',
    lembrete: 'border-warning/40 text-warning',
  };
  const s = styles[tipo] || styles.tarefa;

  return (
    <div className={`size-5 rounded-full border-2 ${s}`} />
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function DashboardMockPage() {
  const countdown = useCountdown(MOCK.proximaAcao.dataHora);

  // Current hour to mark timeline
  // Time tracking for timeline positioning (extensible)

  return (
    <div className="relative min-h-screen">
      {/* ────────────────────────────────────────────────────
          ATMOSPHERIC BACKGROUND
          Subtle radial glow from brand purple
         ──────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, var(--glow-primary-subtle) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 100%, var(--glow-primary-faint) 0%, transparent 60%)
          `,
        }}
      />

      <div className="space-y-6">
        {/* ────────────────────────────────────────────────────
            GREETING — Minimal, human
           ──────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight">
              Bom dia, {MOCK.nome}.
            </h1>
            <p className="text-sm text-muted-foreground/60 mt-0.5">
              Você tem {MOCK.atencao.filter(a => a.urgencia === 'critico' || a.urgencia === 'alto').length} itens
              urgentes e {MOCK.meuDia.filter(d => !d.done).length} compromissos restantes hoje.
            </p>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────
            NEXT ACTION — The ONE thing that matters right now
            This is the hero. Not a chart, not a metric.
            "What should I do next?"
           ──────────────────────────────────────────────────── */}
        <GlassPanel depth={3} className="p-5 group cursor-pointer hover:border-primary/20">
          <div className="flex items-center gap-2 text-[11px] text-primary/60 font-medium uppercase tracking-wider mb-3">
            <Zap className="size-3.5" />
            Próxima ação
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Countdown */}
            <div className="flex items-baseline gap-1 tabular-nums shrink-0">
              <span className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                {countdown.h > 0 && <>{countdown.h}<span className="text-muted-foreground/60">h</span>{' '}</>}
                {String(countdown.m).padStart(2, '0')}<span className="text-muted-foreground/60">m</span>
              </span>
              <span className="text-lg text-muted-foreground/60 font-mono">
                {String(countdown.s).padStart(2, '0')}s
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 sm:border-l sm:border-border/10 sm:pl-4">
              <p className="font-heading font-semibold text-lg truncate">
                {MOCK.proximaAcao.tipo}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {MOCK.proximaAcao.parte}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Scale className="size-3" />
                  <span className="truncate">{MOCK.proximaAcao.processo}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span className="truncate">{MOCK.proximaAcao.local}</span>
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="hidden sm:flex items-center text-primary/40 group-hover:text-primary/70 transition-colors">
              <ArrowRight className="size-5" />
            </div>
          </div>
        </GlassPanel>

        {/* ────────────────────────────────────────────────────
            PULSE — At-a-glance health of the practice
            Not KPI cards. Compact, ambient, scannable.
           ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Processos',
              valor: MOCK.pulse.processos.valor.toString(),
              delta: MOCK.pulse.processos.delta,
              trend: MOCK.pulse.processos.trend,
              icon: Scale,
            },
            {
              label: 'Expedientes',
              valor: MOCK.pulse.expedientes.valor.toString(),
              delta: MOCK.pulse.expedientes.delta,
              trend: MOCK.pulse.expedientes.trend,
              alert: MOCK.pulse.expedientes.alerta,
              icon: FileText,
            },
            {
              label: 'Saldo',
              valor: fmtMoeda(MOCK.pulse.saldo.valor),
              delta: MOCK.pulse.saldo.delta,
              trend: MOCK.pulse.saldo.trend,
              icon: Wallet,
            },
          ].map((p) => (
            <GlassPanel key={p.label} depth={1} className="px-4 py-3 cursor-pointer hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{p.label}</p>
                  <p className="text-xl font-display font-bold mt-0.5 truncate">{p.valor}</p>
                  <p className={`text-[11px] mt-0.5 ${p.alert ? 'text-destructive' : 'text-muted-foreground/50'}`}>
                    {p.delta}
                  </p>
                </div>
                <Sparkline data={p.trend} alert={p.alert} />
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* ────────────────────────────────────────────────────
            MAIN ZONE — "Requer Atenção" + "Meu Dia"
            The killer innovation: unified priority list.
            Not expedientes, audiências, obrigações separately.
            ONE list, sorted by "when does this explode?"
           ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* REQUER ATENÇÃO — 3 cols */}
          <GlassPanel depth={1} className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground/50" />
                <h2 className="text-widget-title">Requer Atenção</h2>
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                {MOCK.atencao.length} itens
              </span>
            </div>

            <div className="space-y-1">
              {MOCK.atencao.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-xl
                             hover:bg-white/4 transition-all duration-150 cursor-pointer group"
                >
                  <UrgencyDot level={item.urgencia} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.titulo}</span>
                      <TypeBadge tipo={item.tipo} />
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">{item.detalhe}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/45 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* MEU DIA — 2 cols */}
          <GlassPanel depth={1} className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground/50" />
                <h2 className="text-widget-title">Meu Dia</h2>
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                {MOCK.meuDia.filter(d => d.done).length}/{MOCK.meuDia.length}
              </span>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-2.25 top-3 bottom-3 w-px bg-border/20" />

              <div className="space-y-0.5">
                {MOCK.meuDia.map((item, i) => {
                  const isPast = item.done;
                  const isNext = !item.done && (i === 0 || MOCK.meuDia[i - 1].done);

                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 py-2 px-1 rounded-lg transition-all duration-150 cursor-pointer
                        ${isNext ? 'bg-primary/4' : 'hover:bg-white/3'}
                      `}
                    >
                      <div className="relative z-10 mt-0.5">
                        <TimelineIcon tipo={item.tipo} done={item.done} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-[11px] tabular-nums shrink-0 ${isPast ? 'text-muted-foreground/55' : 'text-muted-foreground/60'
                            }`}>
                            {item.hora}
                          </span>
                          <span className={`text-sm truncate ${isPast ? 'text-muted-foreground/60 line-through' : ''
                            } ${isNext ? 'font-medium' : ''}`}>
                            {item.titulo}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* ────────────────────────────────────────────────────
            PANORAMA FINANCEIRO — Compressed glass strip
            Not a full chart section. Just the pulse of money.
           ──────────────────────────────────────────────────── */}
        <GlassPanel depth={1} className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <TrendingUp className="size-4 text-muted-foreground/50" />
              <h2 className="text-widget-title">Panorama</h2>
            </div>

            <div className="flex-1 flex items-center gap-6 overflow-x-auto">
              {/* Mini sparkline */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground/60">Receita 6m</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoeda(67500)}</span>
                </div>
                <Sparkline data={MOCK.financeiro.receita} />
              </div>

              <div className="w-px h-8 bg-border/10 shrink-0 hidden sm:block" />

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground/60">Despesa 6m</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoeda(32100)}</span>
                </div>
                <Sparkline data={MOCK.financeiro.despesa} alert />
              </div>

              <div className="w-px h-8 bg-border/10 shrink-0 hidden sm:block" />

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-success/60">A receber</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoeda(MOCK.financeiro.receber.valor)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-destructive/60">A pagar</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoeda(MOCK.financeiro.pagar.valor)}</span>
                </div>
              </div>
            </div>

            <button className="text-xs text-primary/50 hover:text-primary transition-colors cursor-pointer shrink-0 flex items-center gap-1">
              Detalhes <ChevronRight className="size-3" />
            </button>
          </div>
        </GlassPanel>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/50 pb-8">
          {'Protótipo v2 — "The Glass Briefing" — dados fictícios'}
        </p>
      </div>
    </div>
  );
}
