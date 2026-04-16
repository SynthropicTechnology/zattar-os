/**
 * Adapter: DocumentoListItem → DocumentoCardData
 *
 * Mapeia os dados do banco para a estrutura visual usada pelos componentes
 * DocumentCard, DocumentListRow, SignerPill e DocumentDetail.
 */

import type { AssinaturaDigitalDocumentoStatus } from "../domain";

// ─── Tipos de saída ────────────────────────────────────────────────────

export type DocStatus = "rascunho" | "pronto" | "concluido" | "cancelado";

export interface AssinanteCardData {
  nome: string;
  email?: string;
  tipo: "cliente" | "representante" | "parte_contraria" | "terceiro" | "convidado" | "usuario";
  status: "pendente" | "concluido";
  diasPendente?: number;
  concluidoEm?: string;
}

export interface DocumentoCardData {
  id: number;
  uuid: string;
  titulo: string;
  status: DocStatus;
  assinantes: AssinanteCardData[];
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
  selfieHabilitada: boolean;
  origem: "documento" | "formulario";
}

// ─── Tipo de entrada (do service/action) ──────────────────────────────

export interface DocumentoListItem {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url: string | null;
  hash_original_sha256: string | null;
  hash_final_sha256: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  contrato_id?: number | null;
  _assinantes_count?: number;
  _assinantes_concluidos?: number;
  _origem?: "documento" | "formulario";
  _cliente_nome?: string;
  _protocolo?: string;
  // Assinantes completos (quando vem de getDocumentoByUuid)
  assinantes?: Array<{
    id: number;
    documento_id: number;
    assinante_tipo: string;
    dados_snapshot: Record<string, unknown>;
    status: "pendente" | "concluido";
    concluido_em?: string | null;
    created_at?: string;
  }>;
}

// ─── Adapter ──────────────────────────────────────────────────────────

function calcDiasPendente(createdAt?: string): number {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Converte um DocumentoListItem (dados do banco) para DocumentoCardData (visual).
 */
export function documentoToCardData(item: DocumentoListItem): DocumentoCardData {
  const assinantes: AssinanteCardData[] = (item.assinantes ?? []).map((a) => ({
    nome: (a.dados_snapshot?.nome_completo as string) || "Sem nome",
    email: (a.dados_snapshot?.email as string) || undefined,
    tipo: a.assinante_tipo as AssinanteCardData["tipo"],
    status: a.status,
    diasPendente: a.status === "pendente" ? calcDiasPendente(a.created_at) : undefined,
    concluidoEm: a.concluido_em ?? undefined,
  }));

  return {
    id: item.id,
    uuid: item.documento_uuid,
    titulo: item.titulo || `Documento #${item.id}`,
    status: item.status as DocStatus,
    assinantes,
    criadoEm: item.created_at,
    atualizadoEm: item.updated_at,
    criadoPor: item._cliente_nome || "Sistema",
    selfieHabilitada: item.selfie_habilitada,
    origem: item._origem ?? "documento",
  };
}

/**
 * Converte uma lista de DocumentoListItem para DocumentoCardData[].
 */
export function documentosToCardData(items: DocumentoListItem[]): DocumentoCardData[] {
  return items.map(documentoToCardData);
}
