"use server"

import { cookies } from "next/headers"
import { listarAcordosPorBuscaCpf } from "@/app/(authenticated)/obrigacoes/service"
import type { AcordoComParcelas, Parcela, FormaPagamento } from "@/app/(authenticated)/obrigacoes/domain"
import type { PagamentoPortal, ResumoFinanceiroPortal, StatusPagamentoPortal } from "./domain"

// ============================================================================
// Helpers
// ============================================================================

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const dia = date.getDate().toString().padStart(2, "0")
  const mes = MESES[date.getMonth()]
  const ano = date.getFullYear()
  return `${dia} ${mes} ${ano}`
}

const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  transferencia_direta: "Transferência Direta",
  deposito_judicial: "Depósito Judicial",
  deposito_recursal: "Depósito Recursal",
}

function mapFormaPagamento(forma: FormaPagamento | null): string | undefined {
  if (!forma) return undefined
  return FORMA_PAGAMENTO_LABELS[forma] ?? undefined
}

function determinarStatusPortal(parcela: Parcela): StatusPagamentoPortal {
  // Already paid/received
  if (parcela.status === "recebida" || parcela.status === "paga") {
    return "Pago"
  }

  // Explicitly marked as overdue
  if (parcela.status === "atrasada") {
    return "Atrasado"
  }

  // Pending but past due date
  if (parcela.status === "pendente") {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(parcela.dataVencimento + "T00:00:00")
    if (vencimento < hoje) {
      return "Atrasado"
    }
    return "Pendente"
  }

  // Cancelled parcelas are not shown, but just in case
  return "Pendente"
}

function buildDescricao(acordo: AcordoComParcelas, parcela: Parcela): string {
  const tipoLabel = acordo.tipo === "acordo"
    ? "Acordo"
    : acordo.tipo === "condenacao"
      ? "Condenação"
      : "Custas Processuais"

  const processoLabel = acordo.processo?.numero_processo
    ? ` — ${acordo.processo.numero_processo}`
    : ""

  if (acordo.totalParcelas > 1) {
    return `${tipoLabel}${processoLabel} (${parcela.numeroParcela}/${acordo.totalParcelas})`
  }
  return `${tipoLabel}${processoLabel}`
}

// ============================================================================
// Actions
// ============================================================================

export async function actionObterFinanceiroPortal(): Promise<{
  success: boolean
  data?: {
    pagamentos: PagamentoPortal[]
    resumo: ResumoFinanceiroPortal
  }
  error?: string
}> {
  const cookieStore = await cookies()
  const session = cookieStore.get("portal-cpf-session")?.value
  if (!session) {
    return { success: false, error: "Sessao invalida" }
  }

  try {
    const { cpf } = JSON.parse(session)
    const acordos = await listarAcordosPorBuscaCpf(cpf)

    // Flatten all parcelas from all acordos into portal payments
    const pagamentos: PagamentoPortal[] = []

    for (const acordo of acordos) {
      const parcelas = acordo.parcelas ?? []
      for (const parcela of parcelas) {
        // Skip cancelled parcelas
        if (parcela.status === "cancelada") continue

        const status = determinarStatusPortal(parcela)

        pagamentos.push({
          id: `${acordo.id}-${parcela.id}`,
          descricao: buildDescricao(acordo, parcela),
          data: parcela.dataEfetivacao
            ? formatDate(parcela.dataEfetivacao)
            : formatDate(parcela.dataVencimento),
          dataVencimento: formatDate(parcela.dataVencimento),
          valor: parcela.valorBrutoCreditoPrincipal,
          status,
          metodo: mapFormaPagamento(parcela.formaPagamento),
          processoNumero: acordo.processo?.numero_processo ?? undefined,
        })
      }
    }

    // Sort: overdue first, then pending, then paid; within each group sort by date desc
    const statusOrder: Record<StatusPagamentoPortal, number> = {
      Atrasado: 0,
      Pendente: 1,
      Pago: 2,
    }
    pagamentos.sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status]
      if (orderDiff !== 0) return orderDiff
      // More recent first within same status
      return b.valor - a.valor
    })

    // Calculate summary
    const resumo: ResumoFinanceiroPortal = {
      totalPago: 0,
      totalPendente: 0,
      totalAtrasado: 0,
      quantidadePagamentos: pagamentos.length,
    }

    for (const p of pagamentos) {
      switch (p.status) {
        case "Pago":
          resumo.totalPago += p.valor
          break
        case "Pendente":
          resumo.totalPendente += p.valor
          break
        case "Atrasado":
          resumo.totalAtrasado += p.valor
          break
      }
    }

    return { success: true, data: { pagamentos, resumo } }
  } catch (error) {
    console.error("[Portal] Erro ao obter financeiro:", error)
    return { success: false, error: "Erro ao carregar dados financeiros" }
  }
}
