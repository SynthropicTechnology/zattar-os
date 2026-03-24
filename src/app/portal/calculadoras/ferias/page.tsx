"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { ShieldCheck } from "lucide-react";

export default function FériasCalculatorPage() {
  return (
    <PortalShell>
      {/* Hero Editorial Header */}
      <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-bold text-xs tracking-widest uppercase mb-4 block">
          Calculadoras • Direito do Trabalho
        </span>
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <h2 className="text-5xl lg:text-7xl font-extrabold font-headline tracking-tighter leading-none max-w-2xl text-white">
            Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Férias.</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-sm ml-auto text-right border-r-4 border-primary/20 pr-6 hidden md:block">
            Lógica jurídica de precisão para calcular o pagamento de férias constitucionais e bônus de 1/3.
          </p>
        </div>
      </section>

      {/* Interactive Calculator Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Input Panel */}
        <section className="lg:col-span-7 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 space-y-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none"></div>
          
          {/* Base Salary Input */}
          <div className="space-y-4 relative z-10">
            <label className="block text-zinc-400 text-sm font-bold uppercase tracking-wider">
              Salário Base (Salário Bruto)
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">R$</span>
              <input 
                className="w-full bg-[#262626]/50 border-none rounded-xl py-5 pl-12 pr-4 text-2xl font-bold font-headline text-white focus:ring-2 focus:ring-primary/50 placeholder:text-zinc-600 outline-none transition-all shadow-inner" 
                placeholder="0,00" 
                type="number" 
              />
            </div>
          </div>

          {/* Vacation Days Slider */}
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-end">
              <label className="block text-zinc-400 text-sm font-bold uppercase tracking-wider">
                Dias de Férias
              </label>
              <span className="text-4xl font-black text-primary font-headline">30</span>
            </div>
            <input 
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
              max="30" min="1" type="range" defaultValue="30" 
              style={{
                background: 'linear-gradient(to right, #cc97ff 100%, rgba(255,255,255,0.1) 100%)'
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>01 Dia</span>
              <span>15 Dias</span>
              <span>30 Dias</span>
            </div>
          </div>

          {/* Toggle Group */}
          <div className="pt-8 border-t border-white/5 space-y-4 relative z-10">
            {/* Toggle 1: Abono */}
            <div className="flex items-center justify-between p-4 bg-[#262626]/40 rounded-xl border border-transparent hover:border-white/5 transition-colors group cursor-pointer">
              <div className="space-y-1">
                <span className="block font-bold text-white">Abono Pecuniário</span>
                <span className="block text-xs text-zinc-500">Vender 1/3 das férias (10 dias)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
            </div>

            {/* Toggle 2: Adiantamento 13o */}
            <div className="flex items-center justify-between p-4 bg-[#262626]/40 rounded-xl border border-transparent hover:border-white/5 transition-colors group cursor-pointer">
              <div className="space-y-1">
                <span className="block font-bold text-white">Adiantamento 13º Salário</span>
                <span className="block text-xs text-zinc-500">Receber 1ª parcela do 13º nas férias</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(204,151,255,0.4)] hover:shadow-[0_10px_30px_-5px_rgba(204,151,255,0.6)] active:scale-[0.98] transition-all relative z-10">
            Gerar Cálculo
          </button>
        </section>

        {/* Results Display */}
        <section className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-[#1f1f1f]/80 backdrop-blur-2xl rounded-2xl p-8 border border-primary/20 shadow-2xl overflow-hidden relative">
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <span className="text-primary font-bold text-xs uppercase tracking-widest mb-8 block">
              Detalhamento dos Resultados
            </span>
            
            <div className="space-y-6 mb-10 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Valor das Férias (30 dias)</span>
                <span className="font-mono text-white">R$ 4.500,00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">1/3 Constitucional</span>
                <span className="font-mono text-white">R$ 1.500,00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Abono Pecuniário</span>
                <span className="font-mono text-zinc-600">--</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Adiantamento 13º</span>
                <span className="font-mono text-zinc-600">--</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4 border-t border-white/10">
                <span className="text-white font-bold tracking-wider uppercase text-xs">Total Bruto</span>
                <span className="font-mono font-bold text-primary">R$ 6.000,00</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-6 text-center border border-white/5 relative z-10 shadow-inner">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] mb-2 block">
                Total Líquido Estimado
              </span>
              <div className="text-5xl font-black font-headline tracking-tighter text-white">
                R$ 5.482,<span className="text-primary-dim text-3xl">40</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-4 italic leading-relaxed">
                *Estimativa baseada nas faixas atuais de contribuição do INSS e IRRF (2024). Descontos exatos variam conforme o número de dependentes.
              </p>
            </div>
          </div>

          {/* Tech/Legal Assurance Card */}
          <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/5 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Lógica Verificada</h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Cálculos em conformidade com o Art. 129 a 153 da Consolidação das Leis do Trabalho (CLT).
              </p>
            </div>
          </div>
        </section>

      </div>
    </PortalShell>
  );
}
