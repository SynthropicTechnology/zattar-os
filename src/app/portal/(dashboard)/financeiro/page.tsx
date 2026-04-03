"use client";

import { useState } from "react";
import { EditorialHeader } from "@/app/website";
import { FilterChips } from "@/app/website";
import {
  PlusCircle,
  Wallet,
  TrendingUp,
  CalendarClock,
  Award,
  Eye,
  Download,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface ChartMonth {
  label: string;
  height: string;
  value: string;
  active?: boolean;
}

const CHART_MONTHS: ChartMonth[] = [
  { label: "Abr", height: "40%", value: "R$ 58.000" },
  { label: "Mai", height: "55%", value: "R$ 71.500" },
  { label: "Jun", height: "35%", value: "R$ 49.000" },
  { label: "Jul", height: "65%", value: "R$ 82.000" },
  { label: "Ago", height: "50%", value: "R$ 65.000" },
  { label: "Set", height: "70%", value: "R$ 89.000" },
  { label: "Out", height: "45%", value: "R$ 60.000" },
  { label: "Nov", height: "60%", value: "R$ 76.000" },
  { label: "Dez", height: "75%", value: "R$ 95.000" },
  { label: "Jan", height: "55%", value: "R$ 71.000" },
  { label: "Fev", height: "80%", value: "R$ 104.000" },
  { label: "Mar", height: "100%", value: "R$ 142.500", active: true },
];

type InvoiceStatus = "Pago" | "Atrasado" | "Pendente";

const INVOICES: {
  id: number;
  description: string;
  date: string;
  value: string;
  status: InvoiceStatus;
}[] = [
  {
    id: 1,
    description: "Honorários Advocatícios - Mar/2026",
    date: "15/03/2026",
    value: "R$ 3.500,00",
    status: "Pago",
  },
  {
    id: 2,
    description: "Custas Processuais #2024-001",
    date: "10/03/2026",
    value: "R$ 890,00",
    status: "Pago",
  },
  {
    id: 3,
    description: "Honorários Periciais",
    date: "05/03/2026",
    value: "R$ 2.200,00",
    status: "Atrasado",
  },
  {
    id: 4,
    description: "Taxa Judiciária",
    date: "28/02/2026",
    value: "R$ 450,00",
    status: "Pago",
  },
  {
    id: 5,
    description: "Honorários Advocatícios - Abr/2026",
    date: "15/04/2026",
    value: "R$ 3.500,00",
    status: "Pendente",
  },
];

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Pago: "bg-emerald-500/10 text-emerald-400",
  Atrasado: "bg-red-500/10 text-red-400",
  Pendente: "bg-amber-500/10 text-amber-500",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const INVOICE_FILTER_OPTIONS = ["Todos", "Pagos", "Pendentes", "Vencidos"];

const INVOICE_FILTER_MAP: Record<string, InvoiceStatus | null> = {
  Todos: null,
  Pagos: "Pago",
  Pendentes: "Pendente",
  Vencidos: "Atrasado",
};

export default function FinanceiroPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [chartPeriod, setChartPeriod] = useState<"Mensal" | "Trimestral">(
    "Mensal"
  );

  const filterStatus = INVOICE_FILTER_MAP[activeFilter];
  const filteredInvoices = filterStatus
    ? INVOICES.filter((inv) => inv.status === filterStatus)
    : INVOICES;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Editorial Header                                                     */}
      {/* ------------------------------------------------------------------ */}
      <EditorialHeader
        kicker="FINANCEIRO"
        title="Painel de Gestão."
        description="Controle total sobre o fluxo financeiro dos seus processos."
        actions={
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl hover:brightness-110 hover:shadow-[0_0_20px_rgba(204,151,255,0.35)] transition-all active:scale-95">
            <PlusCircle className="w-4 h-4" />
            Nova Fatura
          </button>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Stats Row                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500">
        {/* Saldo Total */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-8 border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <span className="text-on-surface-variant text-sm font-medium">
              Saldo Total
            </span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black font-headline tracking-tighter text-white tabular-nums">
              R$ 142.500,00
            </h3>
            <p className="text-emerald-400 text-xs flex items-center gap-1 mt-2 font-semibold">
              <TrendingUp className="w-3 h-3" />
              +12.5% em relação ao mês anterior
            </p>
          </div>
          {/* Ambient glow */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
        </div>

        {/* Próximo Vencimento */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-8 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <span className="text-on-surface-variant text-sm font-medium">
              Próximo Vencimento
            </span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarClock className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">
              15 Abr 2026
            </p>
            <h3 className="text-3xl font-black font-headline tracking-tighter text-white tabular-nums mb-4">
              R$ 3.500,00
            </h3>
            <button className="bg-primary text-on-primary-fixed px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all active:scale-95">
              Pagar Agora
            </button>
          </div>
        </div>

        {/* Desempenho Anual */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-8 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <span className="text-on-surface-variant text-sm font-medium">
              Desempenho Anual
            </span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black font-headline tracking-tighter text-emerald-400 tabular-nums">
              +23.8%
            </h3>
            <p className="text-on-surface-variant text-xs mt-2 font-semibold">
              crescimento vs. ano anterior
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Charts Row                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-700">
        {/* Fluxo de Despesas — Bar Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold font-headline text-white">
              Fluxo de Despesas
            </h4>
            <div className="flex items-center gap-1 bg-surface-container-highest rounded-lg p-1">
              {(["Mensal", "Trimestral"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={[
                    "px-3 py-1 rounded-md text-xs font-bold transition-all",
                    chartPeriod === period
                      ? "bg-primary text-on-primary-fixed"
                      : "text-on-surface-variant hover:text-on-surface",
                  ].join(" ")}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Chart area */}
          <div className="relative h-48 w-full flex items-end gap-1.5">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-white/5 w-full" />
              <div className="border-t border-white/5 w-full" />
              <div className="border-t border-white/5 w-full" />
              <div className="border-t border-white/5 w-full" />
              <div className="border-t border-white/5 w-full" />
            </div>

            {/* Bars */}
            {CHART_MONTHS.map((month, i) => (
              <div
                key={i}
                className="group relative flex-1 flex flex-col items-center gap-2"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-surface-container-highest text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md whitespace-nowrap border border-white/10">
                    {month.value}
                  </div>
                </div>

                <div
                  className={
                    month.active
                      ? "w-full rounded-t-md bg-linear-to-t from-primary-dim to-primary shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                      : "w-full rounded-t-md bg-white/6 hover:bg-white/10 transition-all"
                  }
                  style={{ height: month.height }}
                />
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider ${
                    month.active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plano Contratado */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-8 border border-white/5 flex flex-col">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-8">
            Plano Contratado
          </h4>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shrink-0">
              <Award className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-xl text-white font-headline">
                Premium
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Faturamento mensal
              </p>
            </div>
          </div>

          {/* Usage */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-on-surface-variant font-medium">
                Uso do plano
              </span>
              <span className="text-xs font-bold text-white font-mono">
                75%
              </span>
            </div>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: "75%" }}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-auto space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Renovação</span>
              <span className="font-bold text-white font-mono">
                15/04/2026
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Valor mensal</span>
              <span className="font-bold text-white font-mono tabular-nums">
                R$ 3.500,00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Invoices Table                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-surface-container rounded-xl border border-white/5 overflow-hidden animate-in fade-in duration-700">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h4 className="text-xl font-bold font-headline text-white">
            Faturas
          </h4>
          <FilterChips
            options={INVOICE_FILTER_OPTIONS}
            activeOption={activeFilter}
            onSelect={setActiveFilter}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-160">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Descrição
                </th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Data
                </th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Valor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-5 text-sm font-medium text-white">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant font-mono tabular-nums">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-white font-mono tabular-nums">
                    {invoice.value}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[invoice.status]}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Visualizar fatura"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Baixar fatura"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
