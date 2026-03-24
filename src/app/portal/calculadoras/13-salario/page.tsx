"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { Gavel, Download, Share, Sliders, Calendar, CalendarOff } from "lucide-react";

export default function DecimoTerceiroCalculatorPage() {
  return (
    <PortalShell>
      {/* Header Section */}
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-bold text-xs uppercase tracking-widest mb-4 block">
          Calculadoras / Direito do Trabalho
        </span>
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter mb-6 text-white leading-none">
          Motor de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">13º Salário.</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Calcule bônus de fim de ano, gratificações estatutárias e divisões de parcelas com precisão jurídica certificada. Projetado para a elite do RH e profissionais da área trabalhista.
        </p>
      </header>

      {/* Calculation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Input Panel */}
        <section className="lg:col-span-5 space-y-8">
          <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
            <h3 className="text-xl font-headline font-bold mb-8 flex items-center gap-2 text-white">
              <Sliders className="w-5 h-5 text-primary" />
              Parâmetros
            </h3>
            
            {/* Base Salary Input */}
            <div className="space-y-4 mb-8">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Salário Mensal Base (Bruto)
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                <input 
                  className="w-full bg-black/40 border border-transparent focus:border-primary/30 rounded-xl py-4 pl-12 pr-4 text-xl font-headline font-bold text-white transition-all outline-none" 
                  placeholder="0,00" 
                  defaultValue="5000"
                  type="number" 
                />
              </div>
            </div>

            {/* Months Worked Slider */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meses Trabalhados</label>
                <span className="text-2xl font-headline font-black text-primary">
                  12 <span className="text-sm text-zinc-500 font-medium">meses</span>
                </span>
              </div>
              <input 
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                max="12" min="1" type="range" defaultValue="12" 
                style={{
                  background: 'linear-gradient(to right, #cc97ff 100%, rgba(255,255,255,0.1) 100%)'
                }}
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <span>1 Mês</span>
                <span>Ano Completo</span>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 mt-8 space-y-4">
              <p className="text-xs text-zinc-500 italic">
                Baseado nas regulamentações trabalhistas padrão para o ano fiscal de 2024. Frações iguais ou superiores a 15 dias de trabalho no mês contam como mês integral (1/12).
              </p>
              <button className="w-full py-4 bg-primary text-on-primary-fixed font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(204,151,255,0.2)] hover:shadow-[0_4px_20px_rgba(204,151,255,0.4)]">
                Calcular Totais
              </button>
            </div>
          </div>
        </section>

        {/* Results/Breakdown Panel */}
        <section className="lg:col-span-7 space-y-6">
          {/* Main Result Bento Card */}
          <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Bruto 13º Salário</h3>
                <div className="text-5xl md:text-6xl font-headline font-black text-white tracking-tighter">
                  R$ 5.000,00
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest">
                CERTIFICADO
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* Installment 1 */}
              <div className="bg-black/30 rounded-xl p-6 border border-white/5 flex flex-col justify-between min-h-[160px] shadow-inner">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">1ª Parcela</span>
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-3xl font-headline font-black text-white">R$ 2.500,00</div>
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-4">
                  S/ DESC. • ATÉ 30 DE NOVEMBRO
                </div>
              </div>

              {/* Installment 2 */}
              <div className="bg-black/30 rounded-xl p-6 border border-primary/20 border-t-4 border-t-primary flex flex-col justify-between min-h-[160px] shadow-[0_0_20px_rgba(204,151,255,0.05)]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">2ª Parcela</span>
                    <CalendarOff className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-3xl font-headline font-black text-white">R$ 2.145,50</div>
                </div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">
                  C/ DESC. LÍQUIDO • ATÉ 20 DE DEZEMBRO
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Card */}
          <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-lg">
            <h3 className="text-xl font-headline font-bold mb-8 text-white">Análise de Deduções (2ª Parcela)</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Contribuição Previdenciária (INSS)</span>
                <span className="font-headline font-bold text-red-400">- R$ 354,50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Imposto de Renda (IRRF)</span>
                <span className="font-headline font-bold text-red-400">- R$ 0,00</span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <span className="text-white font-bold font-headline uppercase tracking-widest text-xs">Total de Deduções</span>
                <span className="font-headline font-bold text-white">- R$ 354,50</span>
              </div>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col md:flex-row gap-4">
            <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button className="flex-1 py-4 bg-primary text-on-primary-fixed font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(204,151,255,0.2)] hover:shadow-primary/40 transition-all">
              <Share className="w-4 h-4" />
              Compartilhar Relatório
            </button>
          </div>
        </section>

      </div>
    </PortalShell>
  );
}
