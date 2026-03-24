"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { Filter, PenTool, Eye, Download, MoreVertical, CheckCircle2, FileEdit, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default function GestaoContratosPage() {
  return (
    <PortalShell>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl">
          <span className="text-primary font-bold text-xs tracking-widest uppercase mb-2 block font-headline">Portal Jurídico Elite</span>
          <h2 className="text-5xl font-black font-headline tracking-tighter mb-4 text-white">Meus Contratos</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed font-body">
            Gerencie seus acordos legais com precisão algorítmica. Monitore assinaturas e revisões em tempo real.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#1f1f1f] border border-white/10 px-6 py-3 rounded-xl font-bold hover:bg-white/5 transition-colors text-white">
            <Filter className="w-4 h-4 text-primary" />
            Filtros
          </button>
          <Link href="/portal/contratos/gerador" className="w-full sm:w-auto flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(204,151,255,0.4)] transition-all active:scale-95 text-sm">
            <PenTool className="w-4 h-4" />
            Gerar Novo
          </Link>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <button className="px-6 py-2 rounded-full bg-primary text-on-primary-fixed text-sm font-bold shadow-md">Todos (24)</button>
        <button className="px-6 py-2 rounded-full bg-[#191919] text-primary text-sm font-bold border border-white/5 hover:bg-white/5 transition-colors">Assinados (12)</button>
        <button className="px-6 py-2 rounded-full bg-[#191919] text-primary text-sm font-bold border border-white/5 hover:bg-white/5 transition-colors">Pendentes (8)</button>
        <button className="px-6 py-2 rounded-full bg-[#191919] text-primary text-sm font-bold border border-white/5 hover:bg-white/5 transition-colors">Em Revisão (4)</button>
      </div>

      {/* Contracts Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Featured Card */}
        <div className="xl:col-span-8 bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_50px_rgba(168,85,247,0.1)] transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Prioritário</span>
                <span className="text-zinc-500 text-sm font-bold">Atualizado há 2 horas</span>
              </div>
              <h3 className="text-3xl font-black font-headline tracking-tight mb-2 text-white">Acordo de Fusão & Aquisição - Project X</h3>
              <p className="text-zinc-400 text-sm mb-8">Ref: #MAG-99283-FA | Tech-Consortium Intl.</p>
              
              <div className="flex flex-wrap items-center gap-8 mb-8">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></div>
                    <span className="text-amber-500 font-bold text-sm">Em Revisão</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Data Início</p>
                  <span className="text-white font-bold text-sm">12 Out, 2024</span>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Responsável</p>
                  <span className="text-white font-bold text-sm">Dr. Arthur Vance</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
              <button className="bg-white/10 text-white border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-primary/50 hover:bg-white/15 transition-all text-sm">
                <Eye className="w-4 h-4" /> Revisar Cláusulas
              </button>
              <button className="bg-transparent border border-white/10 text-zinc-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:text-white hover:border-white/20 transition-all text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Side Card */}
        <div className="xl:col-span-4 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/5 flex flex-col shadow-lg">
          <div className="mb-6">
            <h4 className="text-xl font-bold font-headline tracking-tight mb-4 text-white">Próximos Vencimentos</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border-l-4 border-red-500 border-white/5 shadow-inner">
                <p className="text-xs text-zinc-400 mb-1 font-medium">Contrato de Prestação v.2</p>
                <p className="font-bold text-sm text-red-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Vence em 48 horas</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border-l-4 border-primary border-white/5 shadow-inner">
                <p className="text-xs text-zinc-400 mb-1 font-medium">NDA - Global Partners</p>
                <p className="font-bold text-sm text-white">Renovação Automática</p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto bg-primary/5 rounded-xl p-6 border border-primary/20">
            <p className="text-sm text-zinc-400 mb-4 font-medium">Plano Zattar permite até 50 contratos/mês.</p>
            <div className="w-full bg-black h-2 rounded-full overflow-hidden mb-2 shadow-inner border border-white/5">
              <div className="bg-gradient-to-r from-purple-800 to-primary h-full w-[65%] shadow-[0_0_10px_rgba(204,151,255,0.8)]"></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-primary uppercase tracking-widest">
              <span>32 Usados</span>
              <span>18 Disp.</span>
            </div>
          </div>
        </div>

        {/* List of Contracts (Grid items) */}
        <div className="xl:col-span-12 space-y-4 mt-6">
          
          {/* Contract Item 1 */}
          <div className="bg-[#191919]/60 hover:bg-[#1f1f1f] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl px-6 py-5 flex flex-col md:flex-row items-center justify-between group shadow-md">
            <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
              <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all border border-white/5 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-lg font-headline tracking-tight text-white truncate">Contrato de Licenciamento de Software SaaS</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 font-mono">#MS-12003</span>
                  <span className="text-xs text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-xs text-zinc-400">Modificado em 05 Nov, 2024</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-primary transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Contract Item 2 */}
          <div className="bg-[#191919]/60 hover:bg-[#1f1f1f] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl px-6 py-5 flex flex-col md:flex-row items-center justify-between group shadow-md">
            <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
              <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/10 transition-all border border-white/5 shrink-0">
                <FileEdit className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-lg font-headline tracking-tight text-white truncate">Acordo de Confidencialidade (NDA) - Parceria Logística</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 font-mono">#MS-12015</span>
                  <span className="text-xs text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-xs text-zinc-400">Enviado em 01 Nov, 2024</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
              <div className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-xs font-bold border border-purple-500/20 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" /> Pendente
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-primary transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Contract Item 3 */}
          <div className="bg-[#191919]/60 hover:bg-[#1f1f1f] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl px-6 py-5 flex flex-col md:flex-row items-center justify-between group shadow-md">
            <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
              <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/10 transition-all border border-white/5 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-lg font-headline tracking-tight text-white truncate">Termo Aditivo - Expansão Territorial Região Sul</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 font-mono">#MS-11988</span>
                  <span className="text-xs text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-xs text-zinc-400">Modificado em 28 Out, 2024</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-500/20 whitespace-nowrap">
                <PenTool className="w-3.5 h-3.5" /> Em Revisão
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-primary transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors hover:bg-white/5 border border-transparent hover:border-white/5">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </PortalShell>
  );
}
