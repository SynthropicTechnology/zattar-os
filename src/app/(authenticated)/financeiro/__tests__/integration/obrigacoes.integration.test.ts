/**
 * Testes de Integração - Serviço de Integração de Obrigações
 *
 * Testa a lógica de sincronização entre acordos/parcelas e o sistema financeiro.
 * Verifica criação de lançamentos, verificação de consistência e reversão.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// =============================================================================
// MOCKS
// =============================================================================

const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: () => mockSupabaseClient,
}));

jest.mock('@/lib/date-utils', () => ({
  todayDateString: () => '2025-02-01',
}));

// Mock do repository
const mockBuscarParcelaPorId = jest.fn();
const mockBuscarParcelasPorAcordo = jest.fn();
const mockDetectarInconsistencias = jest.fn();

jest.mock(
  '../../repository/obrigacoes',
  () => ({
    ObrigacoesRepository: {
      buscarParcelaPorId: (...args: unknown[]) => mockBuscarParcelaPorId(...args),
      buscarParcelasPorAcordo: (...args: unknown[]) => mockBuscarParcelasPorAcordo(...args),
      detectarInconsistencias: (...args: unknown[]) => mockDetectarInconsistencias(...args),
    },
  })
);

// Importar após mocks
import {
  sincronizarParcelaParaFinanceiro,
  sincronizarAcordoCompleto,
  verificarConsistencia,
  reverterSincronizacao,
} from '../../services';

// =============================================================================
// FIXTURES
// =============================================================================

import type { ParcelaComLancamento } from '@/app/(authenticated)/obrigacoes';

function criarParcelaMock(overrides: Partial<ParcelaComLancamento> = {}): ParcelaComLancamento {
  return {
    id: 1,
    acordoCondenacaoId: 100,
    numeroParcela: 1,
    valorBrutoCreditoPrincipal: 5000,
    honorariosSucumbenciais: 500,
    honorariosContratuais: 300,
    valorRepasseCliente: 3500,
    dataVencimento: '2025-02-01',
    dataEfetivacao: '2025-02-01',
    status: 'recebida',
    formaPagamento: 'transferencia_direta',
    statusRepasse: 'nao_aplicavel',
    editadoManualmente: false,
    declaracaoPrestacaoContasUrl: null,
    dataDeclaracaoAnexada: null,
    comprovanteRepasseUrl: null,
    dataRepasse: null,
    usuarioRepasseId: null,
    arquivoQuitacaoReclamante: null,
    dataQuitacaoAnexada: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    dadosPagamento: null,
    lancamentoId: null,
    ...overrides,
  };
}

function criarAcordoDbMock(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    tipo: 'acordo',
    direcao: 'recebimento',
    valor_total: 10000,
    numero_parcelas: 2,
    status: 'pago_parcial',
    processo_id: 999,
    created_by: 'user-123',
    ...overrides,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Creates a chainable Supabase query mock.
 * Terminal methods (single, maybeSingle) return promises.
 * Chain methods return the builder itself.
 */
function createChain(result: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};

  // Terminal methods - return a promise
  chain.single = jest.fn().mockResolvedValue(result);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);

  // Chain methods - return the chain
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.is = jest.fn().mockReturnValue(chain);
  chain.not = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.gt = jest.fn().mockReturnValue(chain);
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lt = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);

  // Make the chain itself awaitable (for queries without terminal .single()/.maybeSingle())
  // e.g., `await supabase.from('x').select('*').eq('y', z)` -> returns { data, error }
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    return Promise.resolve(result).then(resolve, reject);
  };

  return chain;
}

function resetMocks() {
  mockSupabaseClient.from.mockReset();
  mockBuscarParcelaPorId.mockReset();
  mockBuscarParcelasPorAcordo.mockReset();
  mockDetectarInconsistencias.mockReset();
}

// =============================================================================
// TESTES: sincronizarParcelaParaFinanceiro
// =============================================================================

describe('sincronizarParcelaParaFinanceiro', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando parcela não existe', () => {
    it('deve retornar erro com acao="erro"', async () => {
      mockBuscarParcelaPorId.mockResolvedValue(null);

      const resultado = await sincronizarParcelaParaFinanceiro(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.acao).toBe('erro');
      expect(resultado.mensagem).toContain('não encontrada');
    });
  });

  describe('quando acordo não existe', () => {
    it('deve retornar erro quando acordo não é encontrado no banco', async () => {
      const parcela = criarParcelaMock();
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.acao).toBe('erro');
      expect(resultado.mensagem).toContain('Acordo não encontrado');
    });
  });

  describe('quando parcela não está efetivada', () => {
    it('deve ignorar parcela não efetivada sem forçar', async () => {
      const parcelaPendente = criarParcelaMock({
        status: 'pendente',
        dataEfetivacao: null,
      });
      mockBuscarParcelaPorId.mockResolvedValue(parcelaPendente);

      // Mock acordo query
      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: criarAcordoDbMock(), error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1, false);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('ignorado');
      expect(resultado.mensagem).toContain('não efetivada');
    });
  });

  describe('quando lançamento já existe', () => {
    it('deve ignorar se lançamento existe e não está forçando', async () => {
      const parcela = criarParcelaMock();
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      const lancamentoExistente = { id: 500, tipo: 'receita', valor: 5500 };

      // The service calls from() multiple times for different tables.
      // 1st: acordos_condenacoes -> acordo
      // 2nd: lancamentos_financeiros -> existing lancamento
      const calls: string[] = [];
      mockSupabaseClient.from.mockImplementation((table: string) => {
        calls.push(table);
        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock(), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          return createChain({ data: lancamentoExistente, error: null });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1, false);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('ignorado');
      expect(resultado.lancamentoId).toBe(500);
    });
  });

  describe('sincronização com sucesso', () => {
    it('deve criar lançamento para parcela efetivada', async () => {
      const parcela = criarParcelaMock();
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      const tableCallCounts: Record<string, number> = {};
      mockSupabaseClient.from.mockImplementation((table: string) => {
        tableCallCounts[table] = (tableCallCounts[table] || 0) + 1;

        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock(), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          if (tableCallCounts[table] === 1) {
            // buscarLancamentoPorParcela -> null (no existing)
            return createChain({ data: null, error: null });
          }
          // insert -> new id
          return createChain({ data: { id: 500 }, error: null });
        }
        if (table === 'plano_contas') {
          return createChain({ data: { id: 10 }, error: null });
        }
        if (table === 'usuarios') {
          return createChain({ data: { id: 1 }, error: null });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('criado');
      expect(resultado.lancamentoId).toBe(500);
    });

    it('deve calcular valor total corretamente (principal + sucumbenciais)', async () => {
      const parcela = criarParcelaMock({
        valorBrutoCreditoPrincipal: 10000,
        honorariosSucumbenciais: 1500,
      });
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      let insertedData: Record<string, unknown> | null = null;

      const tableCallCounts: Record<string, number> = {};
      mockSupabaseClient.from.mockImplementation((table: string) => {
        tableCallCounts[table] = (tableCallCounts[table] || 0) + 1;

        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock(), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          if (tableCallCounts[table] === 1) {
            return createChain({ data: null, error: null });
          }
          // Capture inserted data
          const chain = createChain({ data: { id: 500 }, error: null });
          (chain.insert as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return chain;
          });
          return chain;
        }
        if (table === 'plano_contas') {
          return createChain({ data: { id: 10 }, error: null });
        }
        if (table === 'usuarios') {
          return createChain({ data: { id: 1 }, error: null });
        }
        return createChain({ data: null, error: null });
      });

      await sincronizarParcelaParaFinanceiro(1);

      // Valor esperado: 10000 + 1500 = 11500
      expect(insertedData).not.toBeNull();
      expect((insertedData as Record<string, unknown>).valor).toBe(11500);
    });
  });

  describe('quando conta contábil não encontrada', () => {
    it('deve retornar erro se conta contábil padrão não existe', async () => {
      const parcela = criarParcelaMock();
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      const tableCallCounts: Record<string, number> = {};
      mockSupabaseClient.from.mockImplementation((table: string) => {
        tableCallCounts[table] = (tableCallCounts[table] || 0) + 1;

        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock(), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          return createChain({ data: null, error: null });
        }
        if (table === 'plano_contas') {
          return createChain({ data: null, error: null });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.acao).toBe('erro');
      expect(resultado.mensagem).toContain('Conta contábil');
    });
  });

  describe('mapeamento de tipo de lançamento', () => {
    it('deve criar receita para acordo de recebimento', async () => {
      const parcela = criarParcelaMock();
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      let insertedData: Record<string, unknown> | null = null;

      const tableCallCounts: Record<string, number> = {};
      mockSupabaseClient.from.mockImplementation((table: string) => {
        tableCallCounts[table] = (tableCallCounts[table] || 0) + 1;

        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock({ direcao: 'recebimento' }), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          if (tableCallCounts[table] === 1) {
            return createChain({ data: null, error: null });
          }
          const chain = createChain({ data: { id: 500 }, error: null });
          (chain.insert as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return chain;
          });
          return chain;
        }
        if (table === 'plano_contas') {
          return createChain({ data: { id: 10 }, error: null });
        }
        if (table === 'usuarios') {
          return createChain({ data: { id: 1 }, error: null });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('criado');
      expect(insertedData).not.toBeNull();
      expect((insertedData as Record<string, unknown>).tipo).toBe('receita');
    });

    it('deve criar despesa para acordo de pagamento', async () => {
      const parcela = criarParcelaMock({
        status: 'paga',
      });
      mockBuscarParcelaPorId.mockResolvedValue(parcela);

      let insertedData: Record<string, unknown> | null = null;

      const tableCallCounts: Record<string, number> = {};
      mockSupabaseClient.from.mockImplementation((table: string) => {
        tableCallCounts[table] = (tableCallCounts[table] || 0) + 1;

        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock({ direcao: 'pagamento' }), error: null });
        }
        if (table === 'lancamentos_financeiros') {
          if (tableCallCounts[table] === 1) {
            return createChain({ data: null, error: null });
          }
          const chain = createChain({ data: { id: 500 }, error: null });
          (chain.insert as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return chain;
          });
          return chain;
        }
        if (table === 'plano_contas') {
          return createChain({ data: { id: 10 }, error: null });
        }
        if (table === 'usuarios') {
          return createChain({ data: { id: 1 }, error: null });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('criado');
      expect(insertedData).not.toBeNull();
      expect((insertedData as Record<string, unknown>).tipo).toBe('despesa');
    });
  });
});

// =============================================================================
// TESTES: sincronizarAcordoCompleto
// =============================================================================

describe('sincronizarAcordoCompleto', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando acordo não existe', () => {
    it('deve retornar erro', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
      });

      const resultado = await sincronizarAcordoCompleto(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erros).toContain('Acordo 999 não encontrado');
    });
  });

  describe('quando acordo está cancelado', () => {
    it('deve retornar erro e não permitir sincronização', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({
          data: criarAcordoDbMock({ status: 'cancelado' }),
          error: null,
        });
      });

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erros).toContain('Acordo cancelado não pode ser sincronizado');
    });
  });

  describe('quando acordo não tem parcelas', () => {
    it('deve retornar sucesso com mensagem sobre parcelas', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({
          data: criarAcordoDbMock(),
          error: null,
        });
      });
      mockBuscarParcelasPorAcordo.mockResolvedValue([]);

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('parcelas');
      expect(resultado.totalProcessado).toBe(0);
    });
  });

  describe('sincronização com sucesso', () => {
    it('deve processar todas as parcelas', async () => {
      const parcelas = [
        criarParcelaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2 }),
      ];

      mockBuscarParcelasPorAcordo.mockResolvedValue(parcelas);
      mockBuscarParcelaPorId.mockImplementation((id: number) =>
        Promise.resolve(parcelas.find((p) => p.id === id) || null)
      );

      // Each sincronizarParcelaParaFinanceiro call accesses supabase.from() multiple times.
      // Use separate terminal results for maybeSingle (buscar -> null) vs single (insert -> id).
      let insertIdCounter = 500;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'acordos_condenacoes') {
          return createChain({ data: criarAcordoDbMock(), error: null });
        }
        if (table === 'plano_contas') {
          return createChain({ data: { id: 10 }, error: null });
        }
        if (table === 'usuarios') {
          return createChain({ data: { id: 1 }, error: null });
        }
        if (table === 'lancamentos_financeiros') {
          // Build a chain where maybeSingle returns null (buscar) and single returns new id (insert)
          const chain = createChain({ data: null, error: null });
          (chain.maybeSingle as jest.Mock).mockResolvedValue({ data: null, error: null });
          (chain.single as jest.Mock).mockImplementation(() =>
            Promise.resolve({ data: { id: ++insertIdCounter }, error: null })
          );
          return chain;
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.totalProcessado).toBe(2);
      expect(resultado.totalSucesso).toBe(2);
    });
  });
});

// =============================================================================
// TESTES: verificarConsistencia
// =============================================================================

describe('verificarConsistencia', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando não há inconsistências', () => {
    it('deve retornar inconsistente=false', async () => {
      mockDetectarInconsistencias.mockResolvedValue([]);

      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: [], error: null });
      });

      const resultado = await verificarConsistencia();

      expect(resultado.inconsistente).toBe(false);
      expect(resultado.parcelasSemLancamento).toHaveLength(0);
      expect(resultado.lancamentosSemParcela).toHaveLength(0);
    });
  });

  describe('quando há parcelas sem lançamento', () => {
    it('deve retornar inconsistente=true com parcelas listadas', async () => {
      const parcelaSemLancamento = criarParcelaMock({
        id: 1,
        numeroParcela: 1,
        valorBrutoCreditoPrincipal: 5000,
        honorariosSucumbenciais: 500,
        status: 'recebida',
      });

      mockDetectarInconsistencias.mockResolvedValue([parcelaSemLancamento]);

      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: [], error: null });
      });

      const resultado = await verificarConsistencia();

      expect(resultado.inconsistente).toBe(true);
      expect(resultado.parcelasSemLancamento).toHaveLength(1);
      expect(resultado.parcelasSemLancamento[0].parcelaId).toBe(1);
      expect(resultado.parcelasSemLancamento[0].valor).toBe(5500); // 5000 + 500
    });
  });

  describe('quando há lançamentos órfãos', () => {
    it('deve retornar inconsistente=true com lançamentos listados', async () => {
      mockDetectarInconsistencias.mockResolvedValue([]);

      const lancamentoOrfao = {
        id: 500,
        descricao: 'Acordo - Parcela 1/2',
        valor: 5500,
        parcela_id: null,
      };

      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: [lancamentoOrfao], error: null });
      });

      const resultado = await verificarConsistencia();

      expect(resultado.inconsistente).toBe(true);
      expect(resultado.lancamentosSemParcela).toHaveLength(1);
      expect(resultado.lancamentosSemParcela[0].lancamentoId).toBe(500);
    });
  });

  describe('quando verificando acordo específico', () => {
    it('deve incluir estatísticas de parcelas', async () => {
      mockDetectarInconsistencias.mockResolvedValue([]);
      mockBuscarParcelasPorAcordo.mockResolvedValue([
        criarParcelaMock({ id: 1 }),
        criarParcelaMock({ id: 2 }),
      ]);

      // Two from() calls for lancamentos_financeiros:
      // 1st: orphan query (return empty)
      // 2nd: count query (return count)
      let lancamentoCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'lancamentos_financeiros') {
          lancamentoCallCount++;
          if (lancamentoCallCount === 1) {
            return createChain({ data: [], error: null });
          }
          // Count query - the chain's select is called with { count: 'exact', head: true }
          // The result should have { count: 1 }
          return createChain({ data: null, error: null, count: 1 } as { data: unknown; error: unknown });
        }
        return createChain({ data: null, error: null });
      });

      const resultado = await verificarConsistencia(100);

      expect(resultado.inconsistente).toBe(false);
      expect(resultado.totalParcelas).toBe(2);
    });
  });
});

// =============================================================================
// TESTES: reverterSincronizacao
// =============================================================================

describe('reverterSincronizacao', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando lançamento não existe para parcela', () => {
    it('deve retornar erro', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        return createChain({ data: null, error: null });
      });

      const resultado = await reverterSincronizacao(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.mensagem).toContain('não encontrad');
    });
  });

  describe('quando lançamento existe', () => {
    it('deve deletar o lançamento com sucesso', async () => {
      const lancamento = { id: 500, tipo: 'receita', valor: 5500 };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // buscarLancamentoPorParcela -> found
          return createChain({ data: lancamento, error: null });
        }
        // delete call -> success
        return createChain({ data: null, error: null });
      });

      const resultado = await reverterSincronizacao(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('revertida');
    });
  });

  describe('quando delete falha', () => {
    it('deve retornar erro', async () => {
      const lancamento = { id: 500, tipo: 'receita', valor: 5500 };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createChain({ data: lancamento, error: null });
        }
        // delete fails
        return createChain({ data: null, error: { message: 'Delete failed' } });
      });

      const resultado = await reverterSincronizacao(1);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.mensagem).toContain('reverter');
    });
  });
});
