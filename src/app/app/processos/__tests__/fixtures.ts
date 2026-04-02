import { Processo, StatusProcesso, ProcessoUnificado } from '../types';

export function criarProcessoMock(overrides?: Partial<Processo>): Processo {
  return {
    id: 1,
    idPje: 12345,
    advogadoId: 1,
    origem: 'acervo_geral',
    trt: 'TRT15',
    grau: '1',
    numeroProcesso: '0001234-56.2023.5.15.0001',
    numero: 1234,
    descricaoOrgaoJulgador: '1ª Vara do Trabalho',
    classeJudicial: 'Reclamação Trabalhista',
    segredoJustica: false,
    codigoStatusProcesso: '100',
    prioridadeProcessual: 0,
    nomeParteAutora: 'João Silva',
    qtdeParteAutora: 1,
    nomeParteRe: 'Empresa XYZ',
    qtdeParteRe: 1,
    dataAutuacao: '2023-01-15',
    juizoDigital: true,
    dataArquivamento: null,
    dataProximaAudiencia: null,
    temAssociacao: false,
    responsavelId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: StatusProcesso.ATIVO,
    ...overrides,
  };
}

export function criarProcessoUnificadoMock(
  overrides?: Partial<ProcessoUnificado>
): ProcessoUnificado {
  return {
    id: 1,
    numeroProcesso: '0001234-56.2023.5.15.0001',
    numero: 1234,
    advogadoId: 1,
    origem: 'acervo_geral',
    instances: [
      {
        grau: '1',
        trt: 'TRT15',
        status: 'ativo',
        descricaoOrgaoJulgador: '1ª Vara do Trabalho',
      },
    ],
    trtOrigem: 'TRT15',
    grauOrigem: '1',
    classeJudicialOrigem: 'Reclamação Trabalhista',
    descricaoOrgaoJulgadorOrigem: '1ª Vara do Trabalho',
    nomeParteAutoraOrigem: 'João Silva',
    qtdeParteAutoraOrigem: 1,
    nomeParteReOrigem: 'Empresa XYZ',
    qtdeParteReOrigem: 1,
    dataAutuacaoOrigem: '2023-01-15',
    segredoJustica: false,
    codigoStatusProcesso: '100',
    status: StatusProcesso.ATIVO,
    prioridadeProcessual: 0,
    juizoDigital: true,
    dataArquivamento: null,
    dataProximaAudiencia: null,
    temAssociacao: false,
    responsavelId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarProcessoDbMock(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    id_pje: 12345,
    advogado_id: 1,
    origem: 'acervo_geral',
    trt: 'TRT15',
    grau: '1',
    numero_processo: '0001234-56.2023.5.15.0001',
    numero: 1234,
    descricao_orgao_julgador: '1ª Vara do Trabalho',
    classe_judicial: 'Reclamação Trabalhista',
    segredo_justica: false,
    codigo_status_processo: '100',
    prioridade_processual: 0,
    nome_parte_autora: 'João Silva',
    qtde_parte_autora: 1,
    nome_parte_re: 'Empresa XYZ',
    qtde_parte_re: 1,
    data_autuacao: '2023-01-15',
    juizo_digital: true,
    data_arquivamento: null,
    data_proxima_audiencia: null,
    tem_associacao: false,
    responsavel_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ativo',
    ...overrides,
  };
}

interface TimelineItem {
  tipo_movimentacao: string;
  metadata: {
    titulo: string;
    capturado_em: string;
  };
}

export function criarTimelineMock(): TimelineItem[] {
  return [
    {
      tipo_movimentacao: 'documento',
      metadata: {
        titulo: 'Petição Inicial',
        capturado_em: '2023-01-15T10:00:00Z',
      },
    },
    {
      tipo_movimentacao: 'movimento',
      metadata: {
        titulo: 'Audiência designada',
        capturado_em: '2023-02-01T14:30:00Z',
      },
    },
  ];
}

// Legacy mocks for backward compatibility
export const criarUsuarioMock = (overrides = {}) => ({
  id: 1,
  nomeCompleto: 'Test User',
  emailCorporativo: 'test@example.com',
  ...overrides,
});

export const criarPecaMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  storage_key: 'uploads/peca-123.pdf',
  content_type: 'application/pdf',
  nome_arquivo: 'peca-123.pdf',
  ...overrides,
});

export const criarAndamentoMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  descricao: 'Andamento de teste',
  data: '2024-01-15',
  ...overrides,
});

export const criarEmbeddingMock = (overrides = {}) => ({
  id: 1,
  entity_type: 'processo_peca',
  entity_id: 1,
  parent_id: 100,
  content: 'Conteúdo de teste',
  embedding: Array(1536).fill(0.1),
  metadata: {
    indexed_by: 1,
    content_type: 'application/pdf',
    storage_key: 'uploads/peca-123.pdf',
  },
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
