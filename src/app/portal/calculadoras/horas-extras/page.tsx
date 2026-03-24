"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { Calculator, ShieldCheck, Download, Share } from "lucide-react";

export default function HorasExtrasCalculatorPage() {
  return (
    <PortalShell>
      {/* Hero Header Section */}
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-bold text-xs uppercase tracking-widest mb-4 block">
          Suite Trabalhista
        </span>
        <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter text-white mb-6 max-w-3xl leading-none">
          Calculadora de <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Horas Extras.</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl font-body leading-relaxed">
          Análises de precisão para acordos profissionais de trabalho. Calcule Horas Extraordinárias com conformidade legal e validação instantânea, separando o DSR.
        </p>
      </div>

      {/* Asymmetric Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Left Column: Inputs (Bento Style) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              
              {/* Gross Salary Input */}
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Salário Bruto (R$)</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-black/40 border border-transparent rounded-xl p-4 text-white focus:border-primary/50 transition-all outline-none font-headline font-bold text-lg" 
                    placeholder="5000,00" 
                    defaultValue="5000"
                    type="number"
                  />
                </div>
              </div>

              {/* Hours per Month Input */}
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Jornada Mensal</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-black/40 border border-transparent rounded-xl p-4 text-white focus:border-primary/50 transition-all outline-none font-headline font-bold text-lg" 
                    placeholder="220" 
                    defaultValue="220"
                    type="number"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">hrs</span>
                </div>
              </div>

              {/* Extra Hours Worked */}
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Horas Extras Realizadas</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-black/40 border border-transparent rounded-xl p-4 text-white focus:border-primary/50 transition-all outline-none font-headline font-bold text-lg" 
                    placeholder="15" 
                    defaultValue="15"
                    type="number"
                  />
                </div>
              </div>

              {/* Percentage Toggle */}
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Adicional (Porcentagem)</label>
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                  <button className="flex-1 py-3 bg-primary text-on-primary-fixed rounded-lg font-bold text-sm shadow-md transition-all">
                    50%
                  </button>
                  <button className="flex-1 py-3 text-zinc-400 rounded-lg font-bold text-sm hover:text-white hover:bg-white/5 transition-all outline-none">
                    100%
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
              <button className="w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_10px_30px_-5px_rgba(204,151,255,0.4)] transition-all active:scale-95 text-sm">
                <Calculator className="w-5 h-5" />
                Executar Desmembramento
              </button>
            </div>
          </div>

          {/* Informational Banner Card */}
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 flex gap-6 items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1 text-sm">Conformidade com a Base CLT</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Nossos algoritmos integram o reflexo sobre o Descanso Semanal Remunerado (DSR) automaticamente, garantindo conformidade processual para acordos.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results (Dynamic Result Card) */}
        <div className="lg:col-span-5 relative">
          <div className="bg-[#1f1f1f]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
            
            <div className="p-8 pb-6 border-b border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none"></div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-4 block">Resultado da Análise</span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black font-headline text-white">R$ 511,36</span>
              </div>
              <span className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mt-2 block">Cálculo Total Bruto das Extras</span>
            </div>

            {/* Data Breakdown */}
            <div className="px-8 py-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5 border-dashed">
                <span className="text-zinc-400 text-sm">Valor da Hora Simples</span>
                <span className="text-white font-medium font-mono">R$ 22,72</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5 border-dashed">
                <span className="text-zinc-400 text-sm">Valor da Hora Extra (+50%)</span>
                <span className="text-white font-medium font-mono">R$ 34,09</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5 border-dashed">
                <span className="text-zinc-400 text-sm">Total de Horas Extras (15h)</span>
                <span className="text-white font-medium font-mono">R$ 511,36</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-zinc-400 text-sm">Reflexo no DSR Estimado</span>
                <span className="text-primary font-medium text-xs border border-primary/20 px-2 py-1 rounded bg-primary/10 tracking-wider">A ADICIONAR SE APLICÁVEL</span>
              </div>
            </div>

            <div className="p-6 bg-black/40 flex gap-4 border-t border-white/5">
              <button className="flex-1 py-3 border border-white/10 hover:border-white/20 rounded-xl text-xs uppercase tracking-widest font-bold text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs uppercase tracking-widest font-bold text-white transition-all flex items-center justify-center gap-2">
                <Share className="w-4 h-4" /> Relatório
              </button>
            </div>
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
