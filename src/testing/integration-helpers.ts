/**
 * INTEGRATION TESTING HELPERS
 *
 * Utilitários reutilizáveis para testes de integração.
 * Inclui mock factories para entidades comuns e helpers de assertividade.
 */
import { jest, expect } from '@jest/globals';
import type { PaginatedResponse } from '@/types';
import type { Contrato, StatusContrato, TipoContrato, TipoCobranca, PapelContratual } from '@/app/(authenticated)/contratos';
import type { Expediente, CodigoTribunal, GrauTribunal, OrigemExpediente } from '@/app/(authenticated)/expedientes';
import { todayDateString, toDateString } from '@/lib/date-utils';

// =============================================================================
// MOCK FACTORIES - CONTRATOS
// =============================================================================

export const mockContrato = (overrides?: Partial<Contrato>): Contrato => ({
  id: 1,
  segmentoId: 1,
  tipoContrato: 'consultoria' as TipoContrato,
  tipoCobranca: 'pro_labore' as TipoCobranca,
  clienteId: 1,
  papelClienteNoContrato: 'autora' as PapelContratual,
  status: 'em_contratacao' as StatusContrato,
  cadastradoEm: todayDateString(),
  responsavelId: null,
  createdBy: null,
  observacoes: null,
  documentos: null,
  dadosAnteriores: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  estagioId: null,
  partes: [],
  statusHistorico: [],
  processos: [],
  ...overrides,
});

// =============================================================================
// MOCK FACTORIES - EXPEDIENTES
// =============================================================================

export const mockExpediente = (overrides?: Partial<Expediente>): Expediente => {
  const { resultadoDecisao = null, ...restOverrides } = overrides ?? {};

  return {
    id: 1,
    idPje: null,
    advogadoId: null,
    processoId: null,
    trt: 'TRT1' as CodigoTribunal,
    grau: 'primeiro_grau' as GrauTribunal,
    numeroProcesso: '1234567-89.2023.5.01.0001',
    descricaoOrgaoJulgador: null,
    classeJudicial: 'ATOrd',
    numero: 1,
    segredoJustica: false,
    codigoStatusProcesso: null,
    prioridadeProcessual: false,
    nomeParteAutora: null,
    qtdeParteAutora: null,
    nomeParteRe: null,
    qtdeParteRe: null,
    dataAutuacao: null,
    juizoDigital: false,
    dataArquivamento: null,
    idDocumento: null,
    dataCienciaParte: null,
    dataPrazoLegalParte: new Date().toISOString(),
    dataCriacaoExpediente: null,
    prazoVencido: false,
    siglaOrgaoJulgador: null,
    dadosAnteriores: null,
    responsavelId: null,
    baixadoEm: null,
    protocoloId: null,
    justificativaBaixa: null,
    tipoExpedienteId: null,
    descricaoArquivos: null,
    arquivoNome: null,
    arquivoUrl: null,
    arquivoBucket: null,
    arquivoKey: null,
    observacoes: null,
    origem: 'manual' as OrigemExpediente,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...restOverrides,
    resultadoDecisao,
  };
};

// =============================================================================
// MOCK FACTORIES - SUPABASE CLIENT
// =============================================================================

/**
 * Mock de Supabase client para testes de integração.
 * Retorna um objeto que simula a API fluente do Supabase.
 */
export const createMockSupabaseForIntegration = () => {
  type MockChain = {
    from: jest.Mock;
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    neq: jest.Mock;
    gt: jest.Mock;
    gte: jest.Mock;
    lt: jest.Mock;
    lte: jest.Mock;
    like: jest.Mock;
    ilike: jest.Mock;
    is: jest.Mock;
    in: jest.Mock;
    contains: jest.Mock;
    containedBy: jest.Mock;
    range: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    single: jest.Mock;
    maybeSingle: jest.Mock;
    rpc: jest.Mock;
  };

  const mockChain: MockChain = {
    from: jest.fn<() => MockChain>().mockReturnThis(),
    select: jest.fn<() => MockChain>().mockReturnThis(),
    insert: jest.fn<() => MockChain>().mockReturnThis(),
    update: jest.fn<() => MockChain>().mockReturnThis(),
    delete: jest.fn<() => MockChain>().mockReturnThis(),
    eq: jest.fn<() => MockChain>().mockReturnThis(),
    neq: jest.fn<() => MockChain>().mockReturnThis(),
    gt: jest.fn<() => MockChain>().mockReturnThis(),
    gte: jest.fn<() => MockChain>().mockReturnThis(),
    lt: jest.fn<() => MockChain>().mockReturnThis(),
    lte: jest.fn<() => MockChain>().mockReturnThis(),
    like: jest.fn<() => MockChain>().mockReturnThis(),
    ilike: jest.fn<() => MockChain>().mockReturnThis(),
    is: jest.fn<() => MockChain>().mockReturnThis(),
    in: jest.fn<() => MockChain>().mockReturnThis(),
    contains: jest.fn<() => MockChain>().mockReturnThis(),
    containedBy: jest.fn<() => MockChain>().mockReturnThis(),
    range: jest.fn<() => MockChain>().mockReturnThis(),
    order: jest.fn<() => MockChain>().mockReturnThis(),
    limit: jest.fn<() => MockChain>().mockReturnThis(),
    single: jest.fn<() => Promise<{ data: null; error: null }>>().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn<() => Promise<{ data: null; error: null }>>().mockResolvedValue({ data: null, error: null }),
    rpc: jest.fn<() => Promise<{ data: null; error: null }>>().mockResolvedValue({ data: null, error: null }),
  };

  return mockChain;
};

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Helper para verificar se a paginação está correta em uma resposta paginada.
 *
 * @param result - Resposta paginada a ser verificada
 * @param expectedPage - Página esperada
 * @param expectedLimit - Limite esperado
 * @param expectedTotal - Total de itens esperado
 */
export const assertPaginationCorrect = (
  result: PaginatedResponse<unknown>,
  expectedPage: number,
  expectedLimit: number,
  expectedTotal: number
) => {
  expect(result.pagination.page).toBe(expectedPage);
  expect(result.pagination.limit).toBe(expectedLimit);
  expect(result.pagination.total).toBe(expectedTotal);
  expect(result.pagination.totalPages).toBe(Math.ceil(expectedTotal / expectedLimit));
  expect(result.pagination.hasMore).toBe(expectedPage < Math.ceil(expectedTotal / expectedLimit));
};

/**
 * Helper para criar um mock de resposta paginada do Supabase.
 *
 * @param data - Array de dados a serem retornados
 * @param count - Total de itens (para paginação)
 */
export const mockSupabasePaginatedResponse = <T>(data: T[], count: number) => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: 'OK',
});

/**
 * Helper para criar um mock de erro do Supabase.
 *
 * @param message - Mensagem de erro
 * @param code - Código de erro do Supabase (opcional)
 */
export const mockSupabaseError = (message: string, code?: string) => ({
  data: null,
  error: {
    message,
    code: code || 'PGRST116',
    details: null,
    hint: null,
  },
});

// =============================================================================
// TEST DATA BUILDERS
// =============================================================================

/**
 * Builder para criar múltiplos contratos para testes.
 *
 * @param count - Número de contratos a serem criados
 * @param baseOverrides - Sobrescritas base aplicadas a todos os contratos
 */
export const buildMultipleContratos = (
  count: number,
  baseOverrides?: Partial<Contrato>
): Contrato[] => {
  return Array.from({ length: count }, (_, i) =>
    mockContrato({
      id: i + 1,
      ...baseOverrides,
    })
  );
};

/**
 * Builder para criar múltiplos expedientes para testes.
 *
 * @param count - Número de expedientes a serem criados
 * @param baseOverrides - Sobrescritas base aplicadas a todos os expedientes
 */
export const buildMultipleExpedientes = (
  count: number,
  baseOverrides?: Partial<Expediente>
): Expediente[] => {
  return Array.from({ length: count }, (_, i) =>
    mockExpediente({
      id: i + 1,
      numeroProcesso: `${String(i + 1).padStart(7, '0')}-89.2023.5.01.0001`,
      ...baseOverrides,
    })
  );
};

// =============================================================================
// DATE HELPERS
// =============================================================================

/**
 * Cria uma data no passado (X dias atrás).
 *
 * @param daysAgo - Número de dias no passado
 */
export const daysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

/**
 * Cria uma data no futuro (X dias à frente).
 *
 * @param daysFromNow - Número de dias no futuro
 */
export const daysFromNow = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

/**
 * Formata uma data para o formato YYYY-MM-DD.
 *
 * @param date - Data a ser formatada (default: hoje)
 */
export const formatDateOnly = (date: Date = new Date()): string => {
  return toDateString(date);
};
