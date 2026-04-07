"use client";

import { useState } from "react";
import { Calculator, Gavel } from "lucide-react";

export function HorasExtrasCalculator() {
  const [salarioBase, setSalarioBase] = useState<number>(5000);
  const [horasMensais, setHorasMensais] = useState<number>(220);
  const [horasExtras, setHorasExtras] = useState<number>(15);
  const [percentual, setPercentual] = useState<number>(50);

  // Cálculos
  const valorHora = salarioBase / horasMensais;
  const multiplicador = 1 + (percentual / 100);
  const valorHoraExtra = valorHora * multiplicador;
  const totalHorasExtras = valorHoraExtra * horasExtras;
  
  // DSR simplificado (1/6 do valor das horas extras em regra geral)
  const dsr = totalHorasExtras / 6;
  const totalBruto = totalHorasExtras + dsr;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 w-full pb-20">
      
      {/* Header */}
      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-primary mb-2 block">
          Labor Law Suite
        </span>
        <h1 className="font-headline font-extrabold text-5xl md:text-6xl tracking-tighter text-on-surface mb-6 max-w-3xl">
          Calculadora de <span className="bg-gradient-to-br from-primary to-primary-dim bg-clip-text text-transparent">Horas Extras</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl font-body">
          Análise de precisão para acordos trabalhistas profissionais. Calcule &quot;Horas Extras&quot; com conformidade legal e validação instantânea.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário / Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-high/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Salário Bruto (R$)</label>
                <input 
                  type="number" 
                  value={salarioBase}
                  onChange={e => setSalarioBase(Number(e.target.value))}
                  className="w-full bg-surface-container-highest border border-white/5 rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Jornada Mensal</label>
                <input 
                  type="number" 
                  value={horasMensais}
                  onChange={e => setHorasMensais(Number(e.target.value))}
                  className="w-full bg-surface-container-highest border border-white/5 rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Qtd. Horas Extras</label>
                <input 
                  type="number" 
                  value={horasExtras}
                  onChange={e => setHorasExtras(Number(e.target.value))}
                  className="w-full bg-surface-container-highest border border-white/5 rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Adicional</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPercentual(50)}
                    className={`flex-1 py-4 font-bold text-sm rounded-lg transition-all ${percentual === 50 ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-white/5'}`}
                  >
                    50%
                  </button>
                  <button 
                    onClick={() => setPercentual(100)}
                    className={`flex-1 py-4 font-bold text-sm rounded-lg transition-all ${percentual === 100 ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-white/5'}`}
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
              <button className="w-full py-5 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed rounded-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(204,151,255,0.3)] transition-all active:scale-95">
                <Calculator className="w-5 h-5" />
                Recalcular
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6 border border-white/5 flex gap-6 items-start">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Gavel className="text-primary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-surface font-bold mb-1">Conformidade com a CLT</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">Nossos algoritmos são atualizados com as últimas reformas trabalhistas, garantindo que seus cálculos sejam embasados para procedimentos legais.</p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest/40 backdrop-blur-[20px] border border-white/10 rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <div className="p-8 pb-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Resultado da Análise</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black font-headline text-on-surface">R$ {totalBruto.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="text-on-surface-variant text-sm font-medium">TOTAL LÍQUIDO</span>
              </div>
            </div>
            
            <div className="px-8 space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-on-surface-variant text-sm">Valor da Hora Base</span>
                <span className="text-on-surface font-medium">R$ {valorHora.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-on-surface-variant text-sm">Valor da Hora Extra ({percentual}%)</span>
                <span className="text-on-surface font-medium">R$ {valorHoraExtra.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-on-surface-variant text-sm">DSR (Repouso Remunerado)</span>
                <span className="text-primary font-medium">R$ {dsr.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="p-8 bg-white/5 flex gap-4">
              <button className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-on-surface hover:bg-white/5 transition-all">Exportar PDF</button>
              <button className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-on-surface hover:bg-white/5 transition-all">Compartilhar Relatório</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
