/**
 * Portal Contratos - Domain Types
 * Simplified contract types for client portal consumption
 */

export type StatusContratoPortal = "Ativo" | "Pendente" | "Encerrado"

export interface ContratoPortal {
  /** Internal numeric ID */
  id: number
  /** Contract type formatted label e.g. "Ajuizamento" */
  titulo: string
  /** Backend status mapped to portal-friendly label */
  status: StatusContratoPortal
  /** Billing type formatted label e.g. "Pro-Exito" */
  tipoCobranca: string
  /** Client role label e.g. "Autora" / "Re" */
  papelCliente: string
  /** Formatted registration date (DD/MM/YYYY) */
  dataCadastro: string
  /** Party names involved in the contract */
  partes: string[]
}
