"use server"

import { cookies } from "next/headers"
// Import directly from service/utils — barrel may pull server-only deps
import { listarContratosPorClienteId } from "@/app/(authenticated)/contratos/service"
import { buscarClientePorDocumento } from "@/app/(authenticated)/partes/service"
import { formatarTipoContrato, formatarTipoCobranca, formatarPapelContratual, formatarData } from "@/app/(authenticated)/contratos/utils/formatters"
import type { Contrato, StatusContrato } from "@/app/(authenticated)/contratos/domain"
import type { ContratoPortal, StatusContratoPortal } from "./domain"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps backend StatusContrato to portal-friendly StatusContratoPortal.
 *
 * - contratado / distribuido -> "Ativo"
 * - em_contratacao -> "Pendente"
 * - desistencia -> "Encerrado"
 */
function mapearStatus(status: StatusContrato): StatusContratoPortal {
  switch (status) {
    case "contratado":
    case "distribuido":
      return "Ativo"
    case "em_contratacao":
      return "Pendente"
    case "desistencia":
      return "Encerrado"
    default:
      return "Pendente"
  }
}

/**
 * Maps backend Contrato to the portal-specific ContratoPortal type.
 */
function mapearParaPortal(contrato: Contrato): ContratoPortal {
  const partes = (contrato.partes ?? []).map(
    (p) => p.nomeSnapshot ?? `Parte #${p.entidadeId}`
  )

  return {
    id: contrato.id,
    titulo: formatarTipoContrato(contrato.tipoContrato),
    status: mapearStatus(contrato.status),
    tipoCobranca: formatarTipoCobranca(contrato.tipoCobranca),
    papelCliente: formatarPapelContratual(contrato.papelClienteNoContrato),
    dataCadastro: formatarData(contrato.cadastradoEm ?? contrato.createdAt),
    partes,
  }
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function actionListarContratosPortal(): Promise<{
  success: boolean
  data?: ContratoPortal[]
  error?: string
}> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("portal-cpf-session")?.value

    if (!session) {
      return { success: false, error: "Sessao nao encontrada. Faca login novamente." }
    }

    let cpf: string
    try {
      const parsed = JSON.parse(session)
      cpf = parsed.cpf
    } catch {
      return { success: false, error: "Sessao invalida. Faca login novamente." }
    }

    if (!cpf) {
      return { success: false, error: "CPF nao encontrado na sessao." }
    }

    const cpfLimpo = cpf.replace(/\D/g, "")

    // 1. Find the client by CPF
    const clienteResult = await buscarClientePorDocumento(cpfLimpo)

    if (!clienteResult.success || !clienteResult.data) {
      return { success: false, error: "Cliente nao encontrado." }
    }

    // 2. List contracts for that client
    const contratos = await listarContratosPorClienteId(clienteResult.data.id)
    const contratosMapeados = contratos.map(mapearParaPortal)

    return { success: true, data: contratosMapeados }
  } catch (error) {
    console.error("[Portal Contratos] Erro ao listar contratos:", error)
    return {
      success: false,
      error: "Erro ao carregar contratos. Tente novamente mais tarde.",
    }
  }
}
