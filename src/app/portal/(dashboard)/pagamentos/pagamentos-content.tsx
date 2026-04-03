"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CreditCard,
  Landmark,
  Receipt,
  Smartphone,
} from "lucide-react"
import type { PagamentoPortal, ResumoFinanceiroPortal, StatusPagamentoPortal } from "../financeiro/domain"

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

function getMetodoIcon(metodo?: string) {
  if (!metodo) return null
  if (metodo.includes("Transferência")) return <Landmark className="w-4 h-4" />
  if (metodo.includes("Judicial")) return <Receipt className="w-4 h-4" />
  if (metodo.includes("Recursal")) return <CreditCard className="w-4 h-4" />
  // Fallback for Pix-like or unknown
  return <Smartphone className="w-4 h-4" />
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

interface PagamentosContentProps {
  pagamentos: PagamentoPortal[]
  resumo?: ResumoFinanceiroPortal
  error?: string
}

// ============================================================================
// Component
// ============================================================================

export function PagamentosContent({ pagamentos, resumo, error }: PagamentosContentProps) {
  const [activeFilter, setActiveFilter] = useState("Todos")

  if (error) {
    return (
      <div className="bg-surface-container rounded-xl border border-white/5 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-on-surface-variant text-sm">{error}</p>
      </div>
    )
  }

  const filterStatus = FILTER_MAP[activeFilter]
  const filtered = filterStatus
    ? pagamentos.filter((p) => p.status === filterStatus)
    : pagamentos

  const totalFiltered = filtered.reduce((acc, p) => acc + p.valor, 0)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
          PAGAMENTOS
        </p>
        <h1 className="text-3xl font-black font-headline tracking-tight text-white">
          Pagamentos
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Historico completo de parcelas e obrigacoes financeiras.
        </p>
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-xl border border-white/5 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">
            {pagamentos.length} parcela{pagamentos.length !== 1 ? "s" : ""} encontrada{pagamentos.length !== 1 ? "s" : ""}
          </p>
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

        {/* Table header */}
        <div className="bg-surface-container-low px-6 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center border-b border-white/5">
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            Descricao
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-28 text-right">
            Vencimento
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-32 text-right">
            Valor
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-36 text-center">
            Metodo
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-24 text-center">
            Status
          </span>
        </div>

        {/* Rows */}
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
                className="px-6 py-4 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {pagamento.descricao}
                  </p>
                  {pagamento.processoNumero && (
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate font-mono">
                      {pagamento.processoNumero}
                    </p>
                  )}
                </div>

                <p className="text-sm text-on-surface-variant w-28 text-right shrink-0 tabular-nums">
                  {pagamento.dataVencimento ?? pagamento.data}
                </p>

                <p className="text-sm font-semibold text-on-surface w-32 text-right shrink-0 tabular-nums">
                  {formatCurrency(pagamento.valor)}
                </p>

                <div className="w-36 flex items-center justify-center gap-1.5 shrink-0">
                  {pagamento.metodo ? (
                    <>
                      <span className="text-on-surface-variant">
                        {getMetodoIcon(pagamento.metodo)}
                      </span>
                      <span className="text-sm text-on-surface-variant truncate">
                        {pagamento.metodo}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-on-surface-variant/50">—</span>
                  )}
                </div>

                <div className="w-24 flex justify-center shrink-0">
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

        {/* Footer summary */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            {filtered.length} de {pagamentos.length} registros
            {filterStatus && (
              <span className="ml-1">
                — Total: <span className="font-semibold text-on-surface tabular-nums">{formatCurrency(totalFiltered)}</span>
              </span>
            )}
          </p>
          {resumo && (
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
          )}
        </div>
      </div>
    </>
  )
}
