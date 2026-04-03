"use client";

import {
  EditorialHeader,
  StatCard,
  ActivityItem,
  FilterChips,
} from "@/app/website";
import {
  Scale,
  Calendar,
  Wallet,
  FileText,
  Plus,
  ChevronRight,
  Gavel,
  PenTool,
  Bell,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CHART_BARS = [
  { label: "Jan", h: "35%", active: false },
  { label: "Fev", h: "55%", active: false },
  { label: "Mar", h: "45%", active: false },
  { label: "Abr", h: "70%", active: false },
  { label: "Mai", h: "60%", active: false },
  { label: "Jun", h: "85%", active: false },
  { label: "Jul", h: "50%", active: false },
  { label: "Ago", h: "75%", active: false },
  { label: "Set", h: "90%", active: false },
  { label: "Out", h: "65%", active: false },
  { label: "Nov", h: "80%", active: false },
  { label: "Dez", h: "100%", active: true },
];

const RECENT_ACTIVITIES = [
  {
    icon: <FileText className="w-4 h-4" />,
    iconBg: "bg-primary/15 text-primary",
    title: "Protocolo de petição recebido pelo TST — Processo #4829",
    timestamp: "2h atrás",
  },
  {
    icon: <Gavel className="w-4 h-4" />,
    iconBg: "bg-emerald-500/15 text-emerald-400",
    title: "Sentença parcialmente favorável proferida — Processo cível Banco XYZ",
    timestamp: "Ontem, 14:32",
  },
  {
    icon: <PenTool className="w-4 h-4" />,
    iconBg: "bg-amber-500/15 text-amber-400",
    title: "Contrato de prestação de serviços aguarda sua assinatura",
    timestamp: "Ontem, 09:15",
  },
  {
    icon: <Bell className="w-4 h-4" />,
    iconBg: "bg-blue-500/15 text-blue-400",
    title: "Audiência de conciliação agendada para 15 de Abril — 09:30",
    timestamp: "3 dias atrás",
  },
  {
    icon: <UserCheck className="w-4 h-4" />,
    iconBg: "bg-surface-container-high text-on-surface",
    title: "Dados bancários verificados com sucesso pela administração",
    timestamp: "5 dias atrás",
  },
];

const ACTIVITY_FILTER_OPTIONS = ["Todos", "Processos", "Documentos"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPortalPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Editorial Header                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EditorialHeader
          kicker="PAINEL DO CLIENTE"
          title="Dashboard."
          gradient
          description="Controle total dos seus processos, audiências e pagamentos."
          actions={
            <>
              {/* Time-period toggle */}
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-highest text-on-surface-variant rounded-lg hover:text-on-surface transition-colors">
                  Hoje
                </button>
                <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-highest text-on-surface-variant rounded-lg hover:text-on-surface transition-colors">
                  Semana
                </button>
                <button className="px-4 py-1.5 text-xs font-bold bg-primary text-on-primary-fixed rounded-lg shadow-sm">
                  Mês
                </button>
              </div>

              <button className="px-6 py-3 bg-linear-to-r from-primary to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(204,151,255,0.4)] transition-all flex items-center gap-2 active:scale-95 text-sm">
                <Plus className="w-4 h-4" />
                Novo Caso
              </button>
            </>
          }
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Bento Row — 4 cards across 12 cols                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Processos Ativos — spans 3 cols on lg */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            label="Processos Ativos"
            value="12"
            icon={<Scale className="w-5 h-5" />}
            change={2}
            changeLabel="este mês"
            className="glass-card h-full border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
          />
        </div>

        {/* Próxima Audiência — spans 3 cols on lg */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            label="Próxima Audiência"
            value="15 Abr"
            icon={<Calendar className="w-5 h-5" />}
            className="glass-card h-full border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
          />
        </div>

        {/* Saldo Financeiro — spans 3 cols on lg */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            label="Saldo Financeiro"
            value="R$ 142.500"
            icon={<Wallet className="w-5 h-5" />}
            change={12.5}
            changeLabel="vs. mês anterior"
            className="glass-card h-full border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
          />
        </div>

        {/* Contratos — spans 3 cols on lg */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            label="Contratos Ativos"
            value="8"
            icon={<FileText className="w-5 h-5" />}
            className="glass-card h-full border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content Grid — chart (8) + activity feed (4)                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Left — Evolução dos Processos chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl border border-white/5 p-8 shadow-lg flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10">
            <div>
              <h3 className="text-xl font-bold font-headline tracking-tight text-white">
                Evolução dos Processos
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Movimentações registradas nos tribunais — 2024
              </p>
            </div>
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
              <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-high rounded-lg text-primary shadow-sm">
                Mensal
              </button>
              <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors rounded-lg">
                Trimestral
              </button>
              <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors rounded-lg">
                Anual
              </button>
            </div>
          </div>

          {/* Bar chart placeholder */}
          <div className="flex-1 relative h-56">
            {/* Dashed grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              <div className="border-t border-white/5 border-dashed w-full" />
              <div className="border-t border-white/5 border-dashed w-full" />
              <div className="border-t border-white/5 border-dashed w-full" />
              <div className="border-t border-white/5 border-dashed w-full" />
              <div className="border-t border-white/4 w-full" />
            </div>

            <div className="relative z-10 h-full flex items-end gap-2 pb-8">
              {CHART_BARS.map((bar) => (
                <div
                  key={bar.label}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      bar.active
                        ? "bg-linear-to-t from-purple-700 to-primary shadow-[0_0_20px_rgba(204,151,255,0.35)] border-t-2 border-primary"
                        : "bg-white/6 group-hover:bg-primary/20 border border-white/0 group-hover:border-primary/25"
                    }`}
                    style={{ height: bar.h }}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      bar.active ? "text-primary" : "text-outline"
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart legend */}
          <div className="flex items-center gap-6 pt-6 border-t border-white/5 mt-2">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="w-3 h-3 rounded-sm bg-primary/70 shadow-[0_0_8px_rgba(204,151,255,0.5)]" />
              Mês atual
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="w-3 h-3 rounded-sm bg-white/10" />
              Meses anteriores
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              +24% vs. 2023
            </div>
          </div>
        </div>

        {/* Right — Atividades Recentes feed */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl border border-white/5 p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-headline tracking-tight text-white">
              Atividades Recentes
            </h3>
            <button className="text-primary text-xs font-bold flex items-center gap-1 hover:text-primary-dim transition-colors group">
              Ver todas
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Activity filter chips */}
          <div className="mb-4">
            <FilterChips
              options={ACTIVITY_FILTER_OPTIONS}
              activeOption="Todos"
              onSelect={() => {}}
            />
          </div>

          <div className="flex-1 space-y-1 -mx-2">
            {RECENT_ACTIVITIES.map((item, i) => (
              <ActivityItem
                key={i}
                icon={item.icon}
                iconBg={item.iconBg}
                title={item.title}
                timestamp={item.timestamp}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Row — Priority case + Next appointment                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
        {/* Featured insight / priority case */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl border border-primary/20 p-8 shadow-lg relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-dim/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="px-2.5 py-1 bg-primary text-on-primary-fixed text-[10px] font-black rounded uppercase tracking-widest shadow-sm">
                  Prioridade
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Processo #4829
                </span>
              </div>
              <h4 className="text-xl font-bold font-headline leading-snug text-white mb-3">
                Ação Trabalhista vs. Nexos Systems Corp.
              </h4>
              <p className="text-sm text-on-surface-variant italic border-l-2 border-primary/50 pl-3 py-1 mb-6">
                &quot;Aguardando publicação do acórdão no TST - previsão para os próximos 3 dias úteis.&quot;
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-on-surface-variant uppercase tracking-widest">
                    Fase Atual: Recurso
                  </span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full w-[85%] bg-linear-to-r from-purple-600 to-primary shadow-[0_0_10px_rgba(204,151,255,0.7)] rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 sm:items-end">
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 rounded-xl text-sm font-bold transition-all text-white flex items-center gap-2 group whitespace-nowrap">
                Ver Processo
                <ArrowUpRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>

              {/* Mini stats for the case */}
              <div className="flex gap-6 text-center sm:flex-col sm:gap-3 sm:text-right">
                <div>
                  <p className="text-2xl font-black font-headline tracking-tighter text-white">
                    3
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                    Documentos
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black font-headline tracking-tighter text-primary">
                    1
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                    Pendência
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next appointment card */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl border border-white/5 p-6 shadow-lg flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-headline uppercase tracking-[0.2em] text-on-surface-variant">
              Próxima Audiência
            </h4>
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <AlertTriangle className="w-3 h-3" />
              Em 22 dias
            </span>
          </div>

          {/* Date block */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center border border-primary/25 shadow-inner shrink-0">
              <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                Abr
              </span>
              <span className="text-2xl font-black text-white leading-none font-headline">
                15
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-snug">
                Audiência de Conciliação
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1 font-bold">
                09:30 &bull; Google Meet
              </p>
              <p className="text-[10px] text-outline uppercase tracking-wider mt-0.5 font-bold">
                Processo #4829
              </p>
            </div>
          </div>

          {/* AI Preparation insight */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              IA sugere revisar documentos protocolados em Fev/2024 antes da audiência.
            </p>
          </div>

          <button className="mt-auto w-full py-3 border border-dashed border-white/15 hover:border-primary/40 hover:bg-primary/5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary transition-all">
            Preparação para Audiência
          </button>
        </div>
      </div>
    </>
  );
}
