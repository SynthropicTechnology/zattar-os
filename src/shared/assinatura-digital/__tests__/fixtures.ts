/**
 * Fixtures para testes de Assinatura Digital.
 *
 * Fornece mock data para DocumentoListItem, DocumentoCardData, e DocumentosStats.
 */

import type { DocumentoListItem, DocumentoCardData, AssinanteCardData } from '../adapters/documento-card-adapter';
import type { DocumentosStats } from '../services/documentos.service';

// ─── DocumentoListItem (dados do banco) ───────────────────────────────

export function criarDocumentoListItemMock(
  overrides?: Partial<DocumentoListItem>,
): DocumentoListItem {
  return {
    id: 1,
    documento_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    titulo: 'Contrato de Honorários — Maria Silva',
    status: 'pronto',
    selfie_habilitada: true,
    pdf_original_url: 'https://storage.example.com/docs/original.pdf',
    pdf_final_url: null,
    hash_original_sha256: 'abc123hash',
    hash_final_sha256: null,
    created_by: 1,
    created_at: '2026-03-28T10:00:00Z',
    updated_at: '2026-03-30T14:00:00Z',
    contrato_id: null,
    _assinantes_count: 3,
    _assinantes_concluidos: 2,
    _origem: 'documento',
    _cliente_nome: 'Dr. Marcos Vieira',
    _protocolo: undefined,
    assinantes: [
      {
        id: 1,
        documento_id: 1,
        assinante_tipo: 'cliente',
        dados_snapshot: { nome_completo: 'Maria Fernanda Silva', email: 'maria@email.com' },
        status: 'concluido',
        concluido_em: '2026-03-29T10:00:00Z',
        created_at: '2026-03-28T10:00:00Z',
      },
      {
        id: 2,
        documento_id: 1,
        assinante_tipo: 'representante',
        dados_snapshot: { nome_completo: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com' },
        status: 'concluido',
        concluido_em: '2026-03-29T11:00:00Z',
        created_at: '2026-03-28T10:00:00Z',
      },
      {
        id: 3,
        documento_id: 1,
        assinante_tipo: 'parte_contraria',
        dados_snapshot: { nome_completo: 'João Carlos Pereira', email: 'joao@email.com' },
        status: 'pendente',
        concluido_em: null,
        created_at: '2026-03-28T10:00:00Z',
      },
    ],
    ...overrides,
  };
}

export function criarDocumentoRascunhoMock(
  overrides?: Partial<DocumentoListItem>,
): DocumentoListItem {
  return criarDocumentoListItemMock({
    id: 4,
    documento_uuid: 'rascunho-uuid-1234',
    titulo: 'Contrato de Prestação de Serviços',
    status: 'rascunho',
    assinantes: [],
    _assinantes_count: 0,
    _assinantes_concluidos: 0,
    ...overrides,
  });
}

export function criarDocumentoConcluidoMock(
  overrides?: Partial<DocumentoListItem>,
): DocumentoListItem {
  return criarDocumentoListItemMock({
    id: 3,
    documento_uuid: 'concluido-uuid-5678',
    titulo: 'Acordo Extrajudicial — Construtora Nova Era',
    status: 'concluido',
    pdf_final_url: 'https://storage.example.com/docs/final.pdf',
    hash_final_sha256: 'final123hash',
    assinantes: [
      {
        id: 10,
        documento_id: 3,
        assinante_tipo: 'cliente',
        dados_snapshot: { nome_completo: 'Ana Beatriz Costa', email: 'ana@email.com' },
        status: 'concluido',
        concluido_em: '2026-03-26T10:00:00Z',
        created_at: '2026-03-20T10:00:00Z',
      },
      {
        id: 11,
        documento_id: 3,
        assinante_tipo: 'representante',
        dados_snapshot: { nome_completo: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com' },
        status: 'concluido',
        concluido_em: '2026-03-27T10:00:00Z',
        created_at: '2026-03-20T10:00:00Z',
      },
    ],
    _assinantes_count: 2,
    _assinantes_concluidos: 2,
    _origem: 'formulario',
    ...overrides,
  });
}

export function criarDocumentoCanceladoMock(
  overrides?: Partial<DocumentoListItem>,
): DocumentoListItem {
  return criarDocumentoListItemMock({
    id: 7,
    documento_uuid: 'cancelado-uuid-9012',
    titulo: 'Contrato de Assessoria — Indústrias Paulista',
    status: 'cancelado',
    assinantes: [
      {
        id: 20,
        documento_id: 7,
        assinante_tipo: 'cliente',
        dados_snapshot: { nome_completo: 'Indústrias Paulista Ltda.', email: 'juridico@paulista.ind.br' },
        status: 'pendente',
        concluido_em: null,
        created_at: '2026-03-10T10:00:00Z',
      },
    ],
    _assinantes_count: 1,
    _assinantes_concluidos: 0,
    ...overrides,
  });
}

// ─── DocumentoCardData (dados adaptados para UI) ──────────────────────

export function criarDocumentoCardDataMock(
  overrides?: Partial<DocumentoCardData>,
): DocumentoCardData {
  return {
    id: 1,
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    titulo: 'Contrato de Honorários — Maria Silva',
    status: 'pronto',
    assinantes: [
      { nome: 'Maria Fernanda Silva', email: 'maria@email.com', tipo: 'cliente', status: 'concluido', concluidoEm: '2026-03-29T10:00:00Z' },
      { nome: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com', tipo: 'representante', status: 'concluido', concluidoEm: '2026-03-29T11:00:00Z' },
      { nome: 'João Carlos Pereira', email: 'joao@email.com', tipo: 'parte_contraria', status: 'pendente', diasPendente: 2 },
    ],
    criadoEm: '2026-03-28T10:00:00Z',
    atualizadoEm: '2026-03-30T14:00:00Z',
    criadoPor: 'Dr. Marcos Vieira',
    selfieHabilitada: true,
    origem: 'documento',
    ...overrides,
  };
}

// ─── AssinanteCardData ────────────────────────────────────────────────

export function criarAssinanteConcluido(overrides?: Partial<AssinanteCardData>): AssinanteCardData {
  return {
    nome: 'Maria Fernanda Silva',
    email: 'maria@email.com',
    tipo: 'cliente',
    status: 'concluido',
    concluidoEm: '2026-03-29T10:00:00Z',
    ...overrides,
  };
}

export function criarAssinantePendente(overrides?: Partial<AssinanteCardData>): AssinanteCardData {
  return {
    nome: 'João Carlos Pereira',
    email: 'joao@email.com',
    tipo: 'parte_contraria',
    status: 'pendente',
    diasPendente: 2,
    ...overrides,
  };
}

export function criarAssinanteAtrasado(overrides?: Partial<AssinanteCardData>): AssinanteCardData {
  return {
    nome: 'Tech Solutions Ltda.',
    email: 'legal@techsol.com',
    tipo: 'cliente',
    status: 'pendente',
    diasPendente: 12,
    ...overrides,
  };
}

// ─── DocumentosStats ──────────────────────────────────────────────────

export function criarStatsMock(overrides?: Partial<DocumentosStats>): DocumentosStats {
  return {
    total: 23,
    rascunhos: 4,
    aguardando: 8,
    concluidos: 9,
    cancelados: 2,
    taxaConclusao: 82,
    tempoMedio: 3.4,
    trendMensal: [12, 15, 18, 14, 20, 23],
    ...overrides,
  };
}

// ─── Lista de documentos variados ─────────────────────────────────────

export function criarListaDocumentosMock(): DocumentoListItem[] {
  return [
    criarDocumentoListItemMock(),
    criarDocumentoRascunhoMock(),
    criarDocumentoConcluidoMock(),
    criarDocumentoCanceladoMock(),
  ];
}
