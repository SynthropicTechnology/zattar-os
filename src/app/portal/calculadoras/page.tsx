"use client";

import { PortalShell } from "@/features/portal";
import Link from "next/link";
import { Calendar, Clock, DollarSign } from "lucide-react";

export default function CalculadorasPortalIndex() {
  return (
    <PortalShell>
      <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-headline text-xs font-bold tracking-widest uppercase mb-4 block">
          Ferramentas Jurídicas
        </span>
        <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-white mb-6">
          Calculadoras <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">Trabalhistas.</span>
        </h2>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Selecione a ferramenta de cálculo desejada abaixo. Todas as calculadoras estão atualizadas com as mais recentes diretrizes da CLT.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link href="/portal/calculadoras/ferias" className="group bg-[#191919]/60 backdrop-blur-xl border border-white/5 hover:border-primary/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 block shadow-lg">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold font-headline text-white mb-3">Férias</h3>
          <p className="text-sm text-on-surface-variant">
            Cálculo preciso de férias constitucionais com e sem abono pecuniário, incluindo o terço (1/3) obrigatório.
          </p>
        </Link>
        
        <Link href="/portal/calculadoras/13-salario" className="group bg-[#191919]/60 backdrop-blur-xl border border-white/5 hover:border-primary/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 block shadow-lg">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
            <DollarSign className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold font-headline text-white mb-3">13º Salário</h3>
          <p className="text-sm text-on-surface-variant">
            Cálculo de gratificação natalina com adiantamento de 1ª parcela e deduções de INSS e IRPF.
          </p>
        </Link>

        <Link href="/portal/calculadoras/horas-extras" className="group bg-[#191919]/60 backdrop-blur-xl border border-white/5 hover:border-primary/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 block shadow-lg">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold font-headline text-white mb-3">Horas Extras</h3>
          <p className="text-sm text-on-surface-variant">
            Cálculo de horas extraordinárias com acréscimo de 50% ou 100%, incluindo reflexos no DSR.
          </p>
        </Link>
      </div>
    </PortalShell>
  );
}
