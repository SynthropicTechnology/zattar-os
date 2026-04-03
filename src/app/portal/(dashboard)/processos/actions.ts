"use server"

import { cookies } from "next/headers"
// Import directly from service — barrel does not export service (server-only deps)
import { buscarProcessosClientePorCpf } from "@/app/(authenticated)/acervo/service"
import type { ProcessoRespostaIA, TimelineItemIA } from "@/app/(authenticated)/acervo/domain"
import type {
  ProcessoPortal,
  ProcessoDetalhePortal,
  StatusProcessoPortal,
  TimelineEventPortal,
  DocumentoPortal,
} from "./domain"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives a portal-friendly status from the acervo response.
 * ProcessoRespostaIA doesn't have a direct status field, so we infer it
 * from the process data (origem and timeline status).
 */
function derivarStatus(processo: ProcessoRespostaIA): StatusProcessoPortal {
  // If the process has no active instances (both null), consider archived
  const temPrimeiroGrau = processo.instancias.primeiro_grau !== null
  const temSegundoGrau = processo.instancias.segundo_grau !== null

  if (!temPrimeiroGrau && !temSegundoGrau) {
    return "Arquivado"
  }

  // Check if there's a recent movement suggesting activity
  if (processo.ultima_movimentacao) {
    return "Em Andamento"
  }

  return "Em Andamento"
}

/**
 * Maps ProcessoRespostaIA to the portal-specific ProcessoPortal type.
 */
function mapearParaPortal(processo: ProcessoRespostaIA): ProcessoPortal {
  const primeiroGrau = processo.instancias.primeiro_grau
  const segundoGrau = processo.instancias.segundo_grau

  // Use the earliest data_inicio as protocol date
  const dataProtocolo =
    primeiroGrau?.data_inicio ?? segundoGrau?.data_inicio ?? "—"

  return {
    id: processo.numero,
    numero: processo.numero,
    tribunal: processo.tribunal,
    titulo: processo.tipo,
    descricao: `${processo.papel_cliente} vs ${processo.parte_contraria}`,
    papelCliente: processo.papel_cliente,
    dataProtocolo,
    status: derivarStatus(processo),
    sigilo: processo.sigilo,
    ultimaMovimentacao: processo.ultima_movimentacao
      ? {
          data: processo.ultima_movimentacao.data,
          descricao: processo.ultima_movimentacao.evento,
        }
      : undefined,
    instancias: {
      primeiroGrau: primeiroGrau
        ? {
            vara: primeiroGrau.vara ?? "—",
            proximaAudiencia: primeiroGrau.proxima_audiencia,
          }
        : undefined,
      segundoGrau: segundoGrau
        ? {
            vara: segundoGrau.vara ?? "—",
            proximaAudiencia: segundoGrau.proxima_audiencia,
          }
        : undefined,
    },
  }
}

/**
 * Parses a DD/MM/YYYY date string into a Date object.
 * Returns null if parsing fails.
 */
function parseDateBR(dateStr: string): Date | null {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return null
  const [dia, mes, ano] = parts.map(Number)
  const d = new Date(ano, mes - 1, dia)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Maps timeline items from ProcessoRespostaIA to portal timeline events.
 * The first item (most recent) is marked as "current", previously dated as "done",
 * and future items as "pending".
 */
function mapearTimelineParaPortal(
  timelineItems: TimelineItemIA[] | undefined
): TimelineEventPortal[] {
  if (!timelineItems || timelineItems.length === 0) return []

  return timelineItems.map((item, index) => ({
    id: index + 1,
    data: item.data,
    titulo: item.evento,
    descricao: item.descricao || item.evento,
    status: index === 0 ? ("current" as const) : ("done" as const),
    documento: item.tem_documento ? item.descricao : undefined,
  }))
}

/**
 * Extracts documents from timeline items.
 */
function extrairDocumentos(
  timelineItems: TimelineItemIA[] | undefined
): DocumentoPortal[] {
  if (!timelineItems) return []

  return timelineItems
    .filter((item) => item.tem_documento)
    .map((item) => ({
      nome: item.descricao || item.evento,
      tipo: "PDF",
    }))
}

/**
 * Calculates days since a DD/MM/YYYY date string.
 */
function calcularDiasEmAndamento(dataProtocolo: string): number {
  const data = parseDateBR(dataProtocolo)
  if (!data) return 0
  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Maps a ProcessoRespostaIA to the full detail portal type.
 */
function mapearParaDetalhePortal(
  processo: ProcessoRespostaIA
): ProcessoDetalhePortal {
  const base = mapearParaPortal(processo)
  const timelineItems = processo.timeline ?? []
  const timeline = mapearTimelineParaPortal(timelineItems)
  const documentos = extrairDocumentos(timelineItems)

  const totalDocumentos = timelineItems.filter((t) => t.tem_documento).length
  const totalMovimentacoes = timelineItems.filter((t) => !t.tem_documento).length

  return {
    ...base,
    timeline,
    documentos,
    stats: {
      diasEmAndamento: calcularDiasEmAndamento(base.dataProtocolo),
      totalDocumentos,
      totalMovimentacoes,
    },
  }
}

// ---------------------------------------------------------------------------
// Session Helper
// ---------------------------------------------------------------------------

async function obterCpfDaSessao(): Promise<
  { success: true; cpf: string } | { success: false; error: string }
> {
  const cookieStore = await cookies()
  const session = cookieStore.get("portal-cpf-session")?.value

  if (!session) {
    return { success: false, error: "Sessão não encontrada. Faça login novamente." }
  }

  try {
    const parsed = JSON.parse(session)
    if (!parsed.cpf) {
      return { success: false, error: "CPF não encontrado na sessão." }
    }
    return { success: true, cpf: parsed.cpf }
  } catch {
    return { success: false, error: "Sessão inválida. Faça login novamente." }
  }
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function actionListarProcessosPortal(): Promise<{
  success: boolean
  data?: ProcessoPortal[]
  error?: string
}> {
  try {
    const sessao = await obterCpfDaSessao()
    if (!sessao.success) {
      return { success: false, error: sessao.error }
    }

    const result = await buscarProcessosClientePorCpf(sessao.cpf)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    const processos = result.data.processos.map(mapearParaPortal)

    return { success: true, data: processos }
  } catch (error) {
    console.error("[Portal Processos] Erro ao listar processos:", error)
    return {
      success: false,
      error: "Erro ao carregar processos. Tente novamente mais tarde.",
    }
  }
}

/**
 * Fetches a single process detail by its numero_processo.
 * Validates that the process belongs to the authenticated client via CPF session.
 */
export async function actionBuscarProcessoPortal(
  processoId: string
): Promise<{ success: boolean; data: ProcessoDetalhePortal | null; error?: string }> {
  try {
    const sessao = await obterCpfDaSessao()
    if (!sessao.success) {
      return { success: false, data: null, error: sessao.error }
    }

    const result = await buscarProcessosClientePorCpf(sessao.cpf)

    if (!result.success) {
      return { success: false, data: null, error: result.error }
    }

    // Find the specific process by matching numero_processo
    // The processoId from the URL is the numero_processo
    const processoEncontrado = result.data.processos.find(
      (p) => p.numero === processoId
    )

    if (!processoEncontrado) {
      return {
        success: false,
        data: null,
        error: "Processo não encontrado ou você não tem acesso a este processo.",
      }
    }

    const detalhe = mapearParaDetalhePortal(processoEncontrado)

    return { success: true, data: detalhe }
  } catch (error) {
    console.error("[Portal Processos] Erro ao buscar detalhe do processo:", error)
    return {
      success: false,
      data: null,
      error: "Erro ao carregar processo. Tente novamente mais tarde.",
    }
  }
}
