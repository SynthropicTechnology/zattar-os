"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { Filter, Download, TrendingUp, CheckCircle, AlertTriangle as WarningIcon, FileText, Paperclip, MoreVertical, Calendar, Clock } from "lucide-react";

export default function ProcessosPage() {
  return (
    <PortalShell>
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl">
          <span className="text-xs font-black tracking-widest text-primary uppercase mb-2 block font-headline">Central de Litigância</span>
          <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-white mb-4 leading-none">Acompanhamento de Processos</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Gestão inteligente e previsão de ativos jurídicos baseada em análise algorítmica.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-6 py-2.5 rounded-xl bg-[#1f1f1f] border border-white/10 text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold text-sm">
            <Filter className="w-4 h-4 text-primary" />
            Filtrar
          </button>
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold hover:shadow-[0_0_20px_rgba(204,151,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
            <Download className="w-4 h-4" />
            Relatório
          </button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl border-l-4 border-l-primary shadow-lg">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Total sob Gestão</p>
          <h3 className="text-2xl font-black text-white">R$ 14.2M</h3>
          <p className="text-primary text-xs mt-2 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> +8.4% este mês
          </p>
        </div>
        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl border-l-4 border-l-purple-500 shadow-lg">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Previsão de Êxito</p>
          <h3 className="text-2xl font-black text-white">R$ 8.7M</h3>
          <div className="w-full bg-black/50 h-1.5 rounded-full mt-4 border border-white/5">
            <div className="bg-purple-500 h-full rounded-full w-[65%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          </div>
        </div>
        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Processos Ativos</p>
          <h3 className="text-2xl font-black text-white">142</h3>
          <p className="text-zinc-500 text-xs mt-2 font-medium">12 novas movimentações hoje</p>
        </div>
        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Vitória</p>
          <h3 className="text-2xl font-black text-white">74.2%</h3>
          <p className="text-pink-400 text-xs mt-2 flex items-center gap-1 font-medium">
            Histórico de 24 meses
          </p>
        </div>
      </div>

      {/* Main Cases List */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Case Card 1 (Detailed Timeline View) */}
        <div className="group relative bg-[#191919]/60 hover:bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-primary/10 transition-all pointer-events-none"></div>
          
          <div className="grid grid-cols-12 gap-8 lg:gap-10 relative z-10">
            {/* Left: Identity */}
            <div className="col-span-12 lg:col-span-4 lg:border-r lg:border-white/5 lg:pr-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Cível / Indenização</span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase">Protocolado: 12 Out 2024</span>
              </div>
              
              <h4 className="text-2xl md:text-3xl font-headline font-black text-white mb-2 tracking-tight">Magistrate vs. Global Tech Corp</h4>
              <p className="text-zinc-400 font-mono text-sm tracking-tighter mb-8">Nº 1002458-12.2024.8.26.0100</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Valor da Causa</p>
                  <p className="text-xl font-black text-white">R$ 2.450k</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Expectativa AI</p>
                  <p className="text-xl font-black text-purple-400">R$ 1.890k</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Próxima Ação</p>
                <div className="flex items-center gap-4 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Indicação de Perito</p>
                    <p className="text-xs text-purple-300">Deadline: 28 Out 2024</p>
                  </div>
                </div>
                <button className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all border border-white/10 text-white">
                  Acessar Painel Completo
                </button>
              </div>
            </div>

            {/* Center/Right: Vertical Detailed Timeline */}
            <div className="col-span-12 lg:col-span-8 border-t border-white/5 lg:border-t-0 pt-6 lg:pt-0">
              <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Histórico de Movimentações (Timeline)</p>
                <button className="text-[10px] text-primary font-bold uppercase hover:underline">Ver todas (24)</button>
              </div>
              
              <div className="relative space-y-0 text-sm">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary via-primary/20 to-transparent"></div>
                
                {/* Timeline Item 1 */}
                <div className="relative pl-10 pb-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary border-4 border-[#191919] shadow-[0_0_15px_rgba(204,151,255,0.6)] z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#191919]"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-xs font-black text-primary">24 OUT 2024</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono"><Clock className="w-3 h-3"/> 14:22</p>
                    </div>
                    <div className="col-span-1 md:col-span-7">
                      <h5 className="text-sm font-bold text-white uppercase mb-2 leading-tight">Deferimento de Perícia</h5>
                      <p className="text-sm text-zinc-400 leading-relaxed">Juiz titular deferiu a realização de perícia técnica nos servidores centrais para verificação de logs de acesso e integridade de dados.</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/5 transition-colors border border-white/5 text-xs font-medium text-zinc-300">
                          <FileText className="w-3.5 h-3.5 text-primary" /> Decisão_Deferimento.pdf
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative pl-10 pb-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-zinc-800 border-4 border-[#191919] z-10"></div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-xs font-black text-white">18 OUT 2024</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono"><Clock className="w-3 h-3"/> 10:05</p>
                    </div>
                    <div className="col-span-1 md:col-span-7">
                      <h5 className="text-sm font-bold text-zinc-300 uppercase mb-2 leading-tight">Réplica à Contestação</h5>
                      <p className="text-sm text-zinc-500 leading-relaxed">Apresentada manifestação sobre a contestação da Global Tech Corp, refutando as preliminares de ilegitimidade passiva.</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/5 transition-colors border border-white/5 text-xs font-medium text-zinc-400">
                          <FileText className="w-3.5 h-3.5" /> Manifestacao_Protocolada.pdf
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Item 3 */}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-zinc-800 border-4 border-[#191919] z-10"></div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-xs font-black text-zinc-400">02 OUT 2024</p>
                      <p className="text-[10px] text-zinc-600 flex items-center gap-1 font-mono"><Clock className="w-3 h-3"/> 09:15</p>
                    </div>
                    <div className="col-span-1 md:col-span-7">
                      <h5 className="text-sm font-bold text-zinc-400 uppercase mb-2 leading-tight">Citação Efetivada</h5>
                      <p className="text-sm text-zinc-600 leading-relaxed">Certidão de mandado cumprido positivo juntada aos autos. Prazo de contestação iniciado.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Case Card 2 */}
        <div className="group relative bg-[#191919]/60 hover:bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg">
          <div className="grid grid-cols-12 gap-8 lg:gap-10 relative z-10">
            {/* Left: Identity */}
            <div className="col-span-12 lg:col-span-4 lg:border-r lg:border-white/5 lg:pr-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest border border-pink-500/20">Trabalhista / Coletiva</span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase">Protocolado: 05 Jan 2025</span>
              </div>
              
              <h4 className="text-2xl md:text-3xl font-headline font-black text-white mb-2 tracking-tight">Sindicato vs. Logistics AI</h4>
              <p className="text-zinc-400 font-mono text-sm tracking-tighter mb-8">Nº 5001223-44.2025.5.02.0001</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Valor da Causa</p>
                  <p className="text-xl font-black text-white">R$ 520k</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Expectativa AI</p>
                  <p className="text-xl font-black text-purple-400">R$ 440k</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Próxima Ação</p>
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5">
                    <Clock className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Aguardar Contestação</p>
                    <p className="text-xs text-zinc-500">Fluxo automático</p>
                  </div>
                </div>
                <button className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all border border-white/10 text-white">
                  Acessar Painel Completo
                </button>
              </div>
            </div>

            {/* Center/Right: Vertical Detailed Timeline */}
            <div className="col-span-12 lg:col-span-8 border-t border-white/5 lg:border-t-0 pt-6 lg:pt-0">
              <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Histórico de Movimentações (Timeline)</p>
                <button className="text-[10px] text-primary font-bold uppercase hover:underline">Ver todas (8)</button>
              </div>
              
              <div className="relative space-y-0 text-sm">
                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary via-primary/20 to-transparent"></div>
                
                {/* Timeline Item 1 */}
                <div className="relative pl-10 pb-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary border-4 border-[#191919] shadow-[0_0_15px_rgba(204,151,255,0.6)] z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#191919]"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-xs font-black text-primary">22 JAN 2025</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono"><Clock className="w-3 h-3"/> 16:45</p>
                    </div>
                    <div className="col-span-1 md:col-span-7">
                      <h5 className="text-sm font-bold text-white uppercase mb-2 leading-tight">Expedição de Mandado</h5>
                      <p className="text-sm text-zinc-400 leading-relaxed">Mandado de citação expedido e enviado via oficial de justiça para a sede da reclamada em São Bernardo do Campo.</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/5 transition-colors border border-white/5 text-xs font-medium text-zinc-300">
                          <Paperclip className="w-3.5 h-3.5 text-primary" /> Mandado_001223.pdf
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-zinc-800 border-4 border-[#191919] z-10"></div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-xs font-black text-white">05 JAN 2025</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono"><Clock className="w-3 h-3"/> 11:30</p>
                    </div>
                    <div className="col-span-1 md:col-span-7">
                      <h5 className="text-sm font-bold text-zinc-300 uppercase mb-2 leading-tight">Protocolo de Inicial</h5>
                      <p className="text-sm text-zinc-500 leading-relaxed">Ação civil coletiva protocolada visando o reconhecimento de vínculo empregatício de prestadores de serviço autônomos.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Pagination */}
      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t border-white/5 pt-8 gap-4">
        <p className="text-sm text-zinc-500">Exibindo <span className="text-white font-bold">1-10</span> de <span className="text-white font-bold">142</span> processos ativos</p>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-[#191919] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors text-white font-bold">
            1
          </button>
          <button className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center hover:bg-white/5 transition-colors text-zinc-500">
            2
          </button>
          <button className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center hover:bg-white/5 transition-colors text-zinc-500">
            3
          </button>
        </div>
      </div>
    </PortalShell>
  );
}
