"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { PlusCircle, AccountBalanceWallet, TrendingUp, EventUpcoming, FilterList, CalendarMonth, Download, Payment, ArrowOutward, WorkspacePremium } from "lucide-react";

export default function FinanceiroPage() {
  return (
    <PortalShell>
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase block mb-2 font-headline">Painel de Gestão</span>
          <h2 className="text-5xl font-extrabold font-headline tracking-tighter leading-tight text-white mb-4">Financeiro.</h2>
          <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
            Controle total sobre o fluxo de capital da sua operação jurídica. Visualize ativos, passivos e projeções em tempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(204,151,255,0.4)] transition-all flex items-center gap-2 active:scale-95 text-sm">
            <PlusCircle className="w-5 h-5" />
            Nova Fatura
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        {/* Summary Card: Main Balance */}
        <div className="col-span-12 lg:col-span-4 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="z-10">
            <div className="flex justify-between items-start mb-8">
              <span className="text-zinc-400 text-sm font-medium">Saldo Total Disponível</span>
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <AccountBalanceWallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-black font-headline tracking-tighter text-white">R$ 142.500,00</h3>
              <p className="text-primary text-sm font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12.5% em relação ao mês anterior
              </p>
            </div>
          </div>
          {/* Visual Element */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>
        </div>

        {/* Summary Card: Pending */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="flex justify-between items-start mb-8">
            <span className="text-zinc-400 text-sm font-medium">Próximo Vencimento</span>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <EventUpcoming className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Vencimento em 02 dias</p>
              <h3 className="text-3xl font-bold font-headline mt-1 text-white">R$ 12.430,00</h3>
            </div>
            <button className="w-full py-3 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all text-sm uppercase tracking-wider relative overflow-hidden group">
              <span className="relative z-10">Pagar Agora</span>
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>

        {/* Summary Card: Yearly Progress */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <div className="flex justify-between items-start mb-6">
            <span className="text-zinc-400 text-sm font-medium">Desempenho Anual</span>
            <span className="text-xs font-mono font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded">FY 2024</span>
          </div>
          <div className="flex items-end gap-2 h-24 mb-6">
            <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-t-md h-[40%]"></div>
            <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-t-md h-[60%]"></div>
            <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-t-md h-[30%]"></div>
            <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-t-md h-[80%]"></div>
            <div className="flex-1 bg-primary/60 hover:bg-primary transition-colors rounded-t-md h-[100%] border-t-2 border-primary shadow-[0_0_15px_rgba(204,151,255,0.3)]"></div>
            <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-t-md h-[50%]"></div>
          </div>
          <p className="text-xs text-zinc-400 font-medium text-center">Faturamento Mensal (Média: R$ 85k)</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-12">
        {/* Charts Section: Detailed Spending */}
        <div className="col-span-12 lg:col-span-8 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h4 className="text-xl font-bold font-headline text-white mb-1">Fluxo de Despesas Anuais</h4>
              <p className="text-sm text-zinc-400">Comparativo entre faturamento e custos operacionais</p>
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button className="px-5 py-2 text-xs font-bold bg-[#1f1f1f] rounded-lg text-primary shadow-sm">Mensal</button>
              <button className="px-5 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">Trimestral</button>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-end justify-between gap-4 border-b border-white/5 pb-2">
            {/* Fake Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-zinc-700 w-full border-dashed"></div>
              <div className="border-t border-zinc-700 w-full border-dashed"></div>
              <div className="border-t border-zinc-700 w-full border-dashed"></div>
              <div className="border-t border-zinc-700 w-full border-dashed"></div>
            </div>
            {/* Bars */}
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-32 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Jan</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-40 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Fev</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-28 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mar</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-52 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Abr</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-gradient-to-t from-purple-600 to-primary h-60 rounded-lg shadow-[0_0_20px_rgba(204,151,255,0.4)] border border-primary/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
              </div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Mai</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-44 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Jun</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-36 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Jul</span>
            </div>
            <div className="group relative flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-white/5 h-48 rounded-lg group-hover:bg-primary/20 transition-all border border-white/0 group-hover:border-primary/30"></div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Ago</span>
            </div>
          </div>
        </div>

        {/* Active Subscription / Method */}
        <div className="col-span-12 lg:col-span-4 bg-[#191919]/60 backdrop-blur-xl rounded-2xl p-8 border border-white/5 flex flex-col shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Plano Contratado</h4>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/30 rounded-2xl flex items-center justify-center shadow-inner">
                <WorkspacePremium className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-xl text-white">Full Service Corporate</p>
                <p className="text-xs text-zinc-400 mt-1">Ciclo de faturamento mensal</p>
              </div>
            </div>
            <div className="space-y-5 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Método de Pagamento</span>
                <span className="flex items-center gap-2 font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Payment className="w-4 h-4 text-zinc-400" />
                  •••• 8842
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Ativo desde</span>
                <span className="font-bold text-white">Outubro, 2023</span>
              </div>
            </div>
          </div>
          <button className="mt-8 py-3 w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-white font-bold flex items-center justify-center gap-2 group">
            Gerenciar Assinatura
            <ArrowOutward className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Invoices / Transactions List */}
      <div className="bg-[#191919]/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h4 className="text-xl md:text-2xl font-bold font-headline tracking-tight text-white">Histórico de Pagamentos</h4>
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 text-zinc-300">
              <FilterList className="w-4 h-4 text-primary" />
              Filtrar por Status
            </button>
            <button className="px-4 py-2.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 text-zinc-300">
              <CalendarMonth className="w-4 h-4 text-primary" />
              Últimos 6 Meses
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Identificador</th>
                <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Emissão</th>
                <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 font-mono font-bold text-white text-sm">INV-2024-0512</td>
                <td className="px-8 py-6 text-zinc-400 font-medium text-sm">12 Mai 2024</td>
                <td className="px-8 py-6 font-black text-white">R$ 4.250,00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase rounded-full tracking-widest inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Pago
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5">
                    <Download className="w-4 h-4" />
                    Baixar Fatura
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 font-mono font-bold text-white text-sm">INV-2024-0412</td>
                <td className="px-8 py-6 text-zinc-400 font-medium text-sm">12 Abr 2024</td>
                <td className="px-8 py-6 font-black text-white">R$ 4.250,00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase rounded-full tracking-widest inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Pago
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5">
                    <Download className="w-4 h-4" />
                    Baixar Fatura
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 font-mono font-bold text-white text-sm">INV-2024-0312</td>
                <td className="px-8 py-6 text-zinc-400 font-medium text-sm">12 Mar 2024</td>
                <td className="px-8 py-6 font-black text-white">R$ 3.890,00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase rounded-full tracking-widest inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Pago
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5">
                    <Download className="w-4 h-4" />
                    Baixar Fatura
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors group bg-red-500/5">
                <td className="px-8 py-6 font-mono font-bold text-red-100 text-sm">INV-2024-0212</td>
                <td className="px-8 py-6 text-red-200/60 font-medium text-sm">12 Fev 2024</td>
                <td className="px-8 py-6 font-black text-white">R$ 3.890,00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase rounded-full tracking-widest inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(248,113,113,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    Atrasado
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-white hover:bg-red-500/30 bg-red-500/20 border border-red-500/40 transition-colors inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-[0_0_15px_rgba(248,113,113,0.3)]">
                    <Payment className="w-4 h-4" />
                    Pagar Agora
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
