"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { Briefcase, ShieldCheck, Building2, ShoppingCart, Sparkles, Printer, Download } from "lucide-react";

export default function GeradorContratosPage() {
  return (
    <PortalShell>
      {/* Editorial Header Section */}
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] block mb-2">
          Redação Jurídica Automatizada
        </span>
        <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight mb-4 text-white">
          Gerador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Contratos.</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
          Gere documentos legais blindados em segundos utilizando a inteligência jurisdicional exclusiva Zattar. Precisão de elite, entrega instantânea.
        </p>
      </header>

      {/* Main Interactive Area: Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Left Column: Form & Selection */}
        <div className="col-span-12 xl:col-span-7 space-y-8">
          
          {/* Step 1: Contract Type Selection */}
          <section className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 border-l-4 border-l-primary/50 shadow-lg">
            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-3 text-white">
              <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-black ring-2 ring-primary/20">01</span>
              Selecionar Instrumento Jurídico
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/40 border border-primary/50 text-primary shadow-[0_0_15px_rgba(204,151,255,0.1)] transition-all">
                <Briefcase className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Trabalhista</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 transition-all">
                <ShieldCheck className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">A.C. / NDA</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 transition-all">
                <Building2 className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Aluguel / Imóvel</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 transition-all">
                <ShoppingCart className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Vendas / B2B</span>
              </button>
            </div>
          </section>

          {/* Step 2: Contract Details Form */}
          <section className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-3 text-white">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black">02</span>
              Configurar Parâmetros
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Nome da Contratante/Cliente</label>
                <input 
                  className="w-full bg-black/40 border-none rounded-xl p-4 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/50 transition-all outline-none" 
                  placeholder="Nome Completo da Pessoa Jurídica" 
                  type="text"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Valor do Contrato (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">R$</span>
                  <input 
                    className="w-full bg-black/40 border-none rounded-xl p-4 pl-12 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/50 transition-all outline-none" 
                    placeholder="0,00" 
                    type="number"
                  />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Duração (Meses)</label>
                <select className="w-full bg-black/40 border-none rounded-xl p-4 text-zinc-300 focus:ring-1 focus:ring-primary/50 transition-all outline-none appearance-none">
                  <option value="indeterminado">Prazo Indeterminado</option>
                  <option value="12">12 Meses</option>
                  <option value="24">24 Meses</option>
                  <option value="custom">Personalizado...</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Data de Início/Eficácia</label>
                <input 
                  className="w-full bg-black/40 border-none rounded-xl p-4 text-white focus:ring-1 focus:ring-primary/50 transition-all outline-none" 
                  type="date"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Cláusulas ou Exigências Específicas</label>
                <textarea 
                  className="w-full bg-black/40 border-none rounded-xl p-4 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none" 
                  placeholder="Insira estipulações personalizadas, termos de não-concorrência, obrigações de EPI ou responsabilizações específicas..." 
                  rows={4}
                ></textarea>
              </div>
            </div>
          </section>

          {/* CTA Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/20 gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Verificação de IA Ativa</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Mapeamento dinâmico CLT/Código Civil.</p>
              </div>
            </div>
            <button className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(204,151,255,0.3)] active:scale-95 transition-all text-xs">
              Sintetizar Minuta
            </button>
          </div>

        </div>

        {/* Right Column: Live Preview */}
        <div className="col-span-12 xl:col-span-5 relative">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Visualização em Tempo Real</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-[#1f1f1f] text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 transition-all">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-[#1f1f1f] text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Document Canvas */}
            <div className="bg-[#f0f0f0] rounded-2xl p-10 shadow-2xl relative overflow-hidden group min-h-[700px] border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#eaeaea] z-0"></div>
              
              {/* Document Content */}
              <div className="relative z-10 space-y-6 flex flex-col h-full text-black">
                <div className="flex justify-between items-start border-b border-black/10 pb-6">
                  <div>
                    <h4 className="font-serif font-bold text-2xl uppercase tracking-wider mb-1">Contrato de Trabalho</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ref: ZAT-2024-089-T</p>
                  </div>
                  <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-xs">ZAT</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-black/5 rounded-lg border-l-2 border-black">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Parte A (Contratante)</p>
                    <p className="text-sm font-bold font-serif">ZATTAR ADVOGADOS ASSOCIADOS</p>
                  </div>
                  <div className="p-3 bg-black/5 rounded-lg border-l-2 border-primary/60">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Parte B (Empregado/Contratado)</p>
                    <p className="text-sm font-medium font-serif border-b border-black/20 pb-0.5 inline-block w-full">Nome completo pendente geração...</p>
                  </div>
                </div>

                <div className="space-y-5 pt-4 flex-1 font-serif text-zinc-800">
                  <div className="space-y-1">
                    <h5 class="text-[11px] font-bold uppercase tracking-widest text-black mb-2">Cláusula Primeira: Do Objeto</h5>
                    <p className="text-[11px] leading-relaxed text-zinc-700 text-justify">
                      A Contratante, neste ato, admite o Contratado para exercer a função supracitada, de acordo com as normas diretivas da corporação, submetendo-se a legislação vigente e orientações de compliance.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 class="text-[11px] font-bold uppercase tracking-widest text-black mb-2">Cláusula Segunda: Da Remuneração</h5>
                    <p className="text-[11px] leading-relaxed text-zinc-700 text-justify">
                      O Contratado perceberá o salário ajustado em formulário principal, pago mensalmente, até o 5º dia útil do mês subsequente, mediante depósito em conta bancária de sua titularidade, já computados os repousos semanais.
                    </p>
                  </div>
                  <div class="space-y-1 opacity-40">
                    <h5 class="text-[11px] font-bold uppercase tracking-widest text-black mb-2 flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> Cláusulas Opcionais / Específicas</h5>
                    <div className="h-2 w-full bg-black/5 mt-2 rounded"></div>
                    <div className="h-2 w-3/4 bg-black/5 mt-2 rounded"></div>
                    <div className="h-2 w-5/6 bg-black/5 mt-2 rounded"></div>
                  </div>
                </div>

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 pt-12">
                  <div className="border-t border-black/30 pt-2 text-center">
                    <p className="text-[8px] uppercase font-bold text-zinc-500">Representante Legal (Zattar)</p>
                  </div>
                  <div className="border-t border-black/30 pt-2 text-center">
                    <p className="text-[8px] uppercase font-bold text-zinc-500">Assinatura do Contratado</p>
                  </div>
                </div>
              </div>

              {/* Ghost Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20 mix-blend-overlay opacity-10">
                <span className="text-[80px] font-black uppercase rotate-[-35deg] tracking-tighter text-black">MINUTA ZATTAR</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </PortalShell>
  );
}
