/**
 * Portal Processos - Domain Types
 * Simplified process types for client portal consumption
 */

export type StatusProcessoPortal = "Em Andamento" | "Concluído" | "Arquivado"

export interface ProcessoPortal {
  /** Internal identifier (numero_processo as unique key) */
  id: string
  /** Formatted process number e.g. "0001234-55.2024.5.03.0001" */
  numero: string
  /** Tribunal name e.g. "TRT 3ª Região" */
  tribunal: string
  /** Process type (classe judicial) e.g. "Ação Trabalhista Ordinária" */
  titulo: string
  /** Parties description e.g. "Autor vs Réu" */
  descricao: string
  /** Client role in the process e.g. "Reclamante" */
  papelCliente: string
  /** Formatted protocol date */
  dataProtocolo: string
  /** Derived status */
  status: StatusProcessoPortal
  /** Whether the process is under judicial secrecy */
  sigilo: boolean
  /** Last movement info if available */
  ultimaMovimentacao?: {
    data: string
    descricao: string
  }
  /** Instance info */
  instancias: {
    primeiroGrau?: {
      vara: string
      proximaAudiencia: string | null
    }
    segundoGrau?: {
      vara: string
      proximaAudiencia: string | null
    }
  }
}

// ---------------------------------------------------------------------------
// Detail & Timeline Types
// ---------------------------------------------------------------------------

export interface TimelineEventPortal {
  id: number
  /** Formatted date (DD/MM/YYYY) */
  data: string
  /** Time of the event if available */
  hora?: string
  /** Event title / name */
  titulo: string
  /** Event description */
  descricao: string
  /** Visual status for timeline rendering */
  status: "done" | "current" | "pending"
  /** Document name if attached */
  documento?: string
}

export interface DocumentoPortal {
  nome: string
  tamanho?: string
  tipo?: string
}

export interface ProcessoDetalhePortal extends ProcessoPortal {
  /** Full timeline events */
  timeline: TimelineEventPortal[]
  /** Documents associated with the process */
  documentos: DocumentoPortal[]
  /** Aggregate stats */
  stats: {
    diasEmAndamento: number
    totalDocumentos: number
    totalMovimentacoes: number
  }
}
