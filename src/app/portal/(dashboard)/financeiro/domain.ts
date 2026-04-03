// ============================================================================
// Portal Financeiro — Domain Types
// ============================================================================

export type StatusPagamentoPortal = "Pago" | "Pendente" | "Atrasado"

export interface PagamentoPortal {
  id: string
  descricao: string
  data: string                // Formatted date (dd Mmm yyyy)
  dataVencimento?: string     // Formatted due date
  valor: number
  status: StatusPagamentoPortal
  metodo?: string             // "Depósito Judicial" | "Depósito Recursal" | "Transferência Direta"
  processoNumero?: string     // Related process number
}

export interface ResumoFinanceiroPortal {
  totalPago: number
  totalPendente: number
  totalAtrasado: number
  quantidadePagamentos: number
}
