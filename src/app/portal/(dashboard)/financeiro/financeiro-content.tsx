"use client"

import { useState } from "react"
import {
  CircleDollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import type { PagamentoPortal, ResumoFinanceiroPortal, StatusPagamentoPortal } from "./domain"

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const STATUS_STYLES: Record<StatusPagamentoPortal, string> = {
  Pago: "bg-emerald-500/10 text-emerald-400",
  Pendente: "bg-amber-500/10 text-amber-500",
  Atrasado: "bg-red-500/10 text-red-400",
}

const FILTER_OPTIONS = ["Todos", "Pagos", "Pendentes", "Atrasados"] as const
const FILTER_MAP: Record<string, StatusPagamentoPortal | null> = {
  Todos: null,
  Pagos: "Pago",
  Pendentes: "Pendente",
  Atrasados: "Atrasado",
}

// ============================================================================
// Props
// ============================================================================

interface FinanceiroContentProps {
  data?: {
    pagamentos: PagamentoPortal[]
    resumo: ResumoFinanceiroPortal
  }
  error?: string
}

// ============================================================================
// Component
// ============================================================================

export function FinanceiroContent({ data, error }: FinanceiroContentProps) {
  const [activeFilter, setActiveFilter] = useState("Todos")

  if (error) {
    return (
      <div className="bg-surface-container rounded-xl border border-white/5 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-on-surface-variant text-sm">{error}</p>
      </div>
    )
  }

  const pagamentos = data?.pagamentos ?? []
  const resumo = data?.resumo ?? {
    totalPago: 0,
    totalPendente: 0,
    totalAtrasado: 0,
    quantidadePagamentos: 0,
  }

  const filterStatus = FILTER_MAP[activeFilter]
  const filtered = filterStatus
    ? pagamentos.filter((p) => p.status === filterStatus)
    : pagamentos

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
          FINANCEIRO
        </p>
        <h1 className="text-3xl font-black font-headline tracking-tight text-white">
          Painel Financeiro
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Acompanhe seus pagamentos e obrigacoes financeiras.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Total Pago */}
        <div className="bg-surface-container rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm font-medium">
              Total Pago
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-black font-headline tracking-tighter text-emerald-400 tabular-nums">
            {formatCurrency(resumo.totalPago)}
          </p>
        </div>

        {/* Total Pendente */}
        <div className="bg-surface-container rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm font-medium">
              Total Pendente
            </span>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-black font-headline tracking-tighter text-amber-500 tabular-nums">
            {formatCurrency(resumo.totalPendente)}
          </p>
        </div>

        {/* Total Atrasado */}
        <div className="bg-surface-container rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm font-medium">
              Total Atrasado
            </span>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-black font-headline tracking-tighter text-red-400 tabular-nums">
            {formatCurrency(resumo.totalAtrasado)}
          </p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-surface-container rounded-xl border border-white/5 overflow-hidden">
        {/* Header + Filters */}
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-headline text-white">
              Pagamentos
            </h2>
            <span className="text-xs text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full font-mono">
              {resumo.quantidadePagamentos}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-highest rounded-lg p-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setActiveFilter(option)}
                className={[
                  "px-3 py-1 rounded-md text-xs font-bold transition-all",
                  activeFilter === option
                    ? "bg-primary text-on-primary-fixed"
                    : "text-on-surface-variant hover:text-on-surface",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-on-surface-variant text-sm">
              Nenhum pagamento encontrado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((pagamento) => (
              <div
                key={pagamento.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {pagamento.descricao}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {pagamento.status === "Pago" ? pagamento.data : `Vencimento: ${pagamento.dataVencimento}`}
                    {pagamento.metodo ? ` — ${pagamento.metodo}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <p className="text-sm font-semibold text-on-surface tabular-nums">
                    {formatCurrency(pagamento.valor)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[pagamento.status]}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {pagamento.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            {filtered.length} de {pagamentos.length} registros
          </p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Pago</p>
              <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                {formatCurrency(resumo.totalPago)}
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Pendente</p>
              <p className="text-sm font-semibold text-amber-500 tabular-nums">
                {formatCurrency(resumo.totalPendente)}
              </p>
            </div>
            {resumo.totalAtrasado > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Atrasado</p>
                  <p className="text-sm font-semibold text-red-400 tabular-nums">
                    {formatCurrency(resumo.totalAtrasado)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
