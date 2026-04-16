export type PacoteStatus = 'ativo' | 'expirado' | 'cancelado' | 'concluido';

export interface Pacote {
  id: number;
  pacote_uuid: string;
  token_compartilhado: string;
  contrato_id: number;
  formulario_id: number;
  status: PacoteStatus;
  criado_por: number | null;
  expira_em: string;
  created_at: string;
  updated_at: string;
}

export interface PacoteDocumento {
  id: number;
  pacote_id: number;
  documento_id: number;
  ordem: number;
}

export interface DocumentoNoPacote {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: string;
  ordem: number;
  token_assinante: string;
  assinado_em: string | null;
}

export interface PacoteComDocumentos {
  pacote: Pacote;
  documentos: DocumentoNoPacote[];
  status_efetivo: PacoteStatus;
}
