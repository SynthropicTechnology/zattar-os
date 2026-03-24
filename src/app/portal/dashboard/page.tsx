"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { 
  Gavel, 
  Calendar as EventIcon, 
  CreditCard as PaymentsIcon, 
  TrendingUp, 
  ChevronRight,
  PenTool, 
  PlusSquare, 
  UploadCloud, 
  Headset,
  FileText,
  User
} from "lucide-react";

export default function DashboardPortalPage() {
  return (
    <PortalShell>
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <span className="text-primary font-headline text-xs font-bold tracking-widest uppercase drop-shadow-[0_0_8px_rgba(204,151,255,0.4)]">
            Bem-Vindo ao Zattar Portal
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-white">
            Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-high p-1 rounded-full border border-white/5 shadow-inner">
          <button className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20">Hoje</button>
          <button className="px-6 py-2 rounded-full text-zinc-500 text-xs font-bold hover:text-zinc-200 transition-colors">Semana</button>
          <button className="px-6 py-2 rounded-full text-zinc-500 text-xs font-bold hover:text-zinc-200 transition-colors">Mês</button>
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button className="group relative bg-[#1f1f1f]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <EventIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center text-white">Próximo Compromisso</span>
          </button>
          
          <button className="group relative bg-[#1f1f1f]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <PenTool className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center text-white">Assinar Contrato</span>
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
          </button>

          <button className="group relative bg-[#1f1f1f]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <PlusSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center text-white">Iniciar Novo Caso</span>
          </button>

          <button className="group relative bg-[#1f1f1f]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center text-white">Enviar Documento</span>
          </button>

          <button className="group relative bg-[#1f1f1f]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 shadow-lg col-span-2 md:col-span-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Headset className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center text-white">Suporte Direto</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Stat Card 1 */}
        <div className="relative bg-[#191919]/60 backdrop-blur-md rounded-xl border border-white/5 p-6 flex flex-col justify-between h-40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Processos Ativos</span>
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <Gavel className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-headline text-white">03</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +1 novo este mês
            </p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="relative bg-[#191919]/60 backdrop-blur-md rounded-xl border border-white/5 p-6 flex flex-col justify-between h-40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Compromissos</span>
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <EventIcon className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-headline text-white">02</p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">Próximos 15 dias</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="relative bg-[#191919]/60 backdrop-blur-md rounded-xl border border-white/5 p-6 md:col-span-2 flex flex-col justify-between h-40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 group overflow-hidden">
          <div className="absolute right-[-5%] bottom-[-15%] opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <PaymentsIcon className="w-40 h-40 text-purple-500" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resumo Financeiro</span>
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <PaymentsIcon className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-headline text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500 drop-shadow-sm">
              R$ 42.850,00
            </p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">Previsão total de recebíveis provisionados</p>
          </div>
        </div>
      </div>

      {/* Main Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Advanced Process Visualization */}
        <div className="lg:col-span-2 bg-[#1f1f1f]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 overflow-hidden relative shadow-lg">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-white">Progresso Recente</h3>
              <p className="text-sm text-on-surface-variant mt-1">Volume de movimentações reais nos tribunais</p>
            </div>
            <button className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary-dim transition-colors group">
              Ver todos detalhados <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2 relative mt-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              <div className="w-full border-t border-white/5"></div>
              <div className="w-full border-t border-white/5"></div>
              <div className="w-full border-t border-white/5"></div>
              <div className="w-full border-t border-white/5"></div>
            </div>

            {/* Bars */}
            {[
              { label: 'Jan', h1: '40%', h2: '65%' },
              { label: 'Fev', h1: '60%', h2: '80%' },
              { label: 'Mar', h1: '30%', h2: '95%', active: true },
              { label: 'Abr', h1: '70%', h2: '40%' },
              { label: 'Mai', h1: '50%', h2: '75%' },
              { label: 'Jun', h1: '40%', h2: '55%' },
            ].map((col, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar z-10 relative">
                <div className="w-full flex items-end gap-1 h-48 group-hover/bar:bg-white/5 rounded-t-lg transition-colors pb-1 px-1">
                  <div className="flex-1 bg-white/10 rounded-t-md transition-all duration-300" style={{ height: col.h1 }}></div>
                  <div className="flex-1 bg-gradient-to-t from-purple-800 to-purple-400 rounded-t-md transition-all duration-300 group-hover/bar:brightness-125 shadow-[0_0_15px_rgba(168,85,247,0.2)]" style={{ height: col.h2 }}></div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${col.active ? 'text-primary' : 'text-zinc-500'}`}>
                  {col.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Case / Immediate Action */}
        <div className="space-y-6">
          <div className="bg-[#191919]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="px-2 py-1 bg-primary text-on-primary-fixed text-[10px] font-black rounded shadow-md">PRIORINADE</span>
              <span className="text-[10px] font-bold text-zinc-400">PROCESSO #4829</span>
            </div>
            <h4 className="text-lg font-bold font-headline mb-2 leading-tight text-white relative z-10">
              Ação Trabalhista vs. Nexos Systems Corp.
            </h4>
            <div className="space-y-4 mt-6 relative z-10">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-2">
                  <span className="text-zinc-400 uppercase tracking-widest">Fase Atual: Recurso</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-primary w-[85%] shadow-[0_0_10px_rgba(204,151,255,0.8)]"></div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic border-l-2 border-primary/50 pl-3 py-1">
                "Aguardando publicação do acórdão no TST previsto para os próximos 3 dias."
              </p>
            </div>
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-white hover:border-primary/50 relative z-10">
              Detalhes do Processo
            </button>
          </div>

          <div className="bg-[#1f1f1f]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
            <h4 className="text-sm font-bold font-headline mb-4 uppercase tracking-widest text-zinc-500">
              Próxima Consulta
            </h4>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center border border-primary/20">
                <span className="text-[10px] font-bold text-primary tracking-widest">OUT</span>
                <span className="text-lg font-black text-white leading-none">24</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Audiência Online de Conciliação</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">09:30 • Google Meet</p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-white/20 hover:border-primary/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-primary transition-all">
              Acessar Link / Preparação
            </button>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-[#1f1f1f]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold font-headline text-white">Linha do Tempo</h3>
          <div className="flex gap-2">
            <span className="px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-[10px] font-bold text-primary cursor-pointer hover:bg-primary/20 transition-colors">Tudo</span>
            <span className="px-4 py-1.5 bg-transparent border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 cursor-pointer hover:bg-white/10 transition-colors">Documentos</span>
          </div>
        </div>
        <div className="space-y-2">
          {/* Feed Item 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
            <div className="mt-1 h-10 w-10 bg-purple-900/40 border border-purple-500/20 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Novo documento anexado</p>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">2h atrás</span>
              </div>
              <p className="text-sm text-on-surface-variant">Protocolo de recebimento emitido pelo TST referente ao Processo #4829.</p>
            </div>
          </div>
          
          <div className="h-4 border-l border-white/10 ml-9"></div>

          {/* Feed Item 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
            <div className="mt-1 h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Gavel className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Sentença parcialmente favorável proferida</p>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ontem</span>
              </div>
              <p className="text-sm text-on-surface-variant">Processo cível contra Banco XYZ concluído em 1ª Instância.</p>
            </div>
          </div>

          <div className="h-4 border-l border-white/10 ml-9"></div>

          {/* Feed Item 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
            <div className="mt-1 h-10 w-10 bg-surface-container-highest border border-white/10 rounded-full flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-bold text-white group-hover:text-zinc-300 transition-colors">Atualização de Perfil</p>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">3 dias atrás</span>
              </div>
              <p className="text-sm text-on-surface-variant">Seus dados bancários foram verificados com sucesso pela administração.</p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
