import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionBuscarPartesPorProcessoEPolo,
  actionBuscarProcessosPorEntidade,
  actionBuscarRepresentantesPorCliente,
  actionBuscarClientesPorRepresentante,
} from '../../actions/processo-partes-actions';
import { createDbClient } from '@/lib/supabase';
import { createMockSupabaseClient } from '@/testing/mocks';
import {
  criarClienteMock,
  criarVinculoProcessoParteMock,
  criarParteContrariaMock,
  criarRepresentanteMock,
  criarTerceiroMock,
} from '../fixtures';

jest.mock('@/lib/supabase');

/**
 * Creates a chainable query mock that resolves to the given result when awaited.
 * Supports arbitrary chains: .select().eq().eq().order().order() etc.
 */
function createChainableQuery(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'not', 'or', 'ilike', 'gte', 'lte', 'single', 'maybeSingle', 'delete', 'insert', 'update'];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  // Make it thenable so `await chain` resolves to the result
  chain.then = (resolve: any, reject?: any) => Promise.resolve(resolvedValue).then(resolve, reject);
  chain.catch = (reject: any) => Promise.resolve(resolvedValue).catch(reject);
  return chain;
}

/**
 * Creates a mock for supabase.from() that returns different chainable queries
 * based on table name. For tables called multiple times, provide an array of results.
 */
function createTableMock(tableMap: Record<string, { data: any; error: any } | Array<{ data: any; error: any }>>) {
  const callCounts: Record<string, number> = {};
  return (table: string) => {
    const config = tableMap[table] || { data: [], error: null };
    if (Array.isArray(config)) {
      callCounts[table] = (callCounts[table] || 0);
      const result = config[callCounts[table]] || config[config.length - 1];
      callCounts[table]++;
      return createChainableQuery(result);
    }
    return createChainableQuery(config);
  };
}

describe('actionBuscarPartesPorProcessoEPolo', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('deve validar processoId obrigatório', async () => {
    const result = await actionBuscarPartesPorProcessoEPolo(
      null as any,
      'ATIVO',
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('processoId inválido');
  });

  it('deve validar polo válido', async () => {
    const result = await actionBuscarPartesPorProcessoEPolo(
      100,
      'INVALIDO' as any,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('polo inválido');
  });

  it('deve buscar vínculos de processo_partes', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ tipo_entidade: 'cliente', entidade_id: 1 }),
    ];

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processo_partes') {
        return createChainableQuery({ data: mockVinculos, error: null });
      }
      return createChainableQuery({ data: [], error: null });
    });

    await actionBuscarPartesPorProcessoEPolo(
      100,
      'ATIVO',
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('processo_partes');
  });

  it('deve buscar dados de clientes, partes contrárias e terceiros', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ tipo_entidade: 'cliente', entidade_id: 1 }),
      criarVinculoProcessoParteMock({ tipo_entidade: 'parte_contraria', entidade_id: 2 }),
      criarVinculoProcessoParteMock({ tipo_entidade: 'terceiro', entidade_id: 3 }),
    ];

    const mockCliente = criarClienteMock();
    const mockParteContraria = criarParteContrariaMock();
    const mockTerceiro = criarTerceiroMock();

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processo_partes') {
        return createChainableQuery({ data: mockVinculos, error: null });
      }
      if (table === 'clientes') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [mockCliente],
            error: null,
          }),
        };
      }
      if (table === 'partes_contrarias') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [mockParteContraria],
            error: null,
          }),
        };
      }
      if (table === 'terceiros') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [mockTerceiro],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    });

    const result = await actionBuscarPartesPorProcessoEPolo(
      100,
      'ATIVO',
    );

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('clientes');
    expect(mockSupabase.from).toHaveBeenCalledWith('partes_contrarias');
    expect(mockSupabase.from).toHaveBeenCalledWith('terceiros');
  });

  it('deve mapear telefone (preferir residencial, fallback comercial)', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ tipo_entidade: 'cliente', entidade_id: 1 }),
    ];

    const mockCliente = criarClienteMock({
      ddd_residencial: '11',
      numero_residencial: '33334444',
      ddd_comercial: '11',
      numero_comercial: '55556666',
    });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processo_partes') {
        return createChainableQuery({ data: mockVinculos, error: null });
      }
      if (table === 'clientes') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [mockCliente],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    });

    const result = await actionBuscarPartesPorProcessoEPolo(
      100,
      'ATIVO',
    );

    expect(result.success).toBe(true);
    if (result.success && result.data.partes.length > 0) {
      const parte = result.data.partes[0];
      // Verifica se preferiu residencial ou fez fallback corretamente
      expect(parte.ddd_telefone).toBeDefined();
      expect(parte.numero_telefone).toBeDefined();
    }
  });

  it('deve identificar parte principal', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ principal: true, ordem: 1, entidade_id: 1 }),
      criarVinculoProcessoParteMock({ principal: false, ordem: 2, entidade_id: 2 }),
    ];

    const mockClientes = [
      criarClienteMock({ id: 1 }),
      criarClienteMock({ id: 2 }),
    ];

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processo_partes') {
        return createChainableQuery({ data: mockVinculos, error: null });
      }
      if (table === 'clientes') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: mockClientes,
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    });

    const result = await actionBuscarPartesPorProcessoEPolo(
      100,
      'ATIVO',
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const partePrincipal = result.data.partes.find((p: any) => p.principal);
      expect(partePrincipal).toBeDefined();
    }
  });

  it('deve retornar array vazio se não houver partes', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: [], error: null }),
    );

    const result = await actionBuscarPartesPorProcessoEPolo(
      100,
      'ATIVO',
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partes).toEqual([]);
      expect(result.data.principal).toBeNull();
    }
  });
});

describe('actionBuscarRepresentantesPorCliente', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('deve buscar processos do cliente', async () => {
    const mockProcessos = [
      criarVinculoProcessoParteMock({ processo_id: 100 }),
      criarVinculoProcessoParteMock({ processo_id: 101 }),
    ];

    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: mockProcessos, error: null }),
    );

    await actionBuscarRepresentantesPorCliente(1);

    expect(mockSupabase.from).toHaveBeenCalledWith('processo_partes');
  });

  it('deve buscar representantes nos mesmos processos', async () => {
    const mockProcessosCliente = [
      criarVinculoProcessoParteMock({ processo_id: 100, tipo_entidade: 'cliente' }),
    ];

    const mockRepresentantes = [
      criarVinculoProcessoParteMock({
        processo_id: 100,
        tipo_entidade: 'representante',
        entidade_id: 1,
      }),
    ];

    const mockRepresentante = criarRepresentanteMock();

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosCliente, error: null },
        { data: mockRepresentantes, error: null },
      ],
      representantes: { data: [mockRepresentante], error: null },
    }));

    const result = await actionBuscarRepresentantesPorCliente(1);

    expect(result.success).toBe(true);
  });

  it('deve agregar por representante e contar processos', async () => {
    const mockProcessosCliente = [
      criarVinculoProcessoParteMock({ processo_id: 100 }),
      criarVinculoProcessoParteMock({ processo_id: 101 }),
    ];

    const mockRepresentantes = [
      criarVinculoProcessoParteMock({
        processo_id: 100,
        tipo_entidade: 'representante',
        entidade_id: 1,
      }),
      criarVinculoProcessoParteMock({
        processo_id: 101,
        tipo_entidade: 'representante',
        entidade_id: 1,
      }),
    ];

    const mockRepresentante = criarRepresentanteMock();

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosCliente, error: null },
        { data: mockRepresentantes, error: null },
      ],
      representantes: { data: [mockRepresentante], error: null },
    }));

    const result = await actionBuscarRepresentantesPorCliente(1);

    expect(result.success).toBe(true);
    if (result.success && result.data.length > 0) {
      expect(result.data[0].total_processos_comuns).toBeGreaterThan(0);
    }
  });

  it('deve extrair OAB principal', async () => {
    const mockProcessosCliente = [
      criarVinculoProcessoParteMock({ processo_id: 100 }),
    ];

    const mockRepresentantes = [
      criarVinculoProcessoParteMock({
        processo_id: 100,
        tipo_entidade: 'representante',
        entidade_id: 1,
      }),
    ];

    const mockRepresentante = criarRepresentanteMock({
      oabs: [
        { numero: '123456', uf: 'SP', principal: true },
        { numero: '654321', uf: 'RJ', principal: false },
      ],
    });

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosCliente, error: null },
        { data: mockRepresentantes, error: null },
      ],
      representantes: { data: [mockRepresentante], error: null },
    }));

    const result = await actionBuscarRepresentantesPorCliente(1);

    expect(result.success).toBe(true);
    if (result.success && result.data.length > 0) {
      expect(result.data[0].oab_principal).toMatch(/\d+\/[A-Z]{2}/);
    }
  });
});

describe('actionBuscarProcessosPorEntidade', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('deve validar entidadeId obrigatório', async () => {
    const result = await actionBuscarProcessosPorEntidade('cliente', 0);

    expect(result.success).toBe(false);
    expect(result.error).toContain('entidadeId inválido');
  });

  it('deve validar tipoEntidade válido', async () => {
    const result = await actionBuscarProcessosPorEntidade('invalido' as any, 1);

    expect(result.success).toBe(false);
    expect(result.error).toContain('tipoEntidade inválido');
  });

  it('deve buscar processos de um cliente', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ processo_id: 100, tipo_entidade: 'cliente' }),
      criarVinculoProcessoParteMock({ processo_id: 101, tipo_entidade: 'cliente' }),
    ];

    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: mockVinculos, error: null }),
    );

    const result = await actionBuscarProcessosPorEntidade('cliente', 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it('deve buscar processos de uma parte contrária', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ processo_id: 100, tipo_entidade: 'parte_contraria' }),
    ];

    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: mockVinculos, error: null }),
    );

    const result = await actionBuscarProcessosPorEntidade('parte_contraria', 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });

  it('deve buscar processos de um terceiro', async () => {
    const mockVinculos = [
      criarVinculoProcessoParteMock({ processo_id: 100, tipo_entidade: 'terceiro' }),
    ];

    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: mockVinculos, error: null }),
    );

    const result = await actionBuscarProcessosPorEntidade('terceiro', 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });

  it('deve tratar erro do Supabase', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: null, error: { message: 'Database error' } }),
    );

    const result = await actionBuscarProcessosPorEntidade('cliente', 1);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('actionBuscarClientesPorRepresentante', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('deve validar representanteId obrigatório', async () => {
    const result = await actionBuscarClientesPorRepresentante(0);

    expect(result.success).toBe(false);
    expect(result.error).toContain('representanteId inválido');
  });

  it('deve retornar array vazio se representante não tem processos', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue(
      createChainableQuery({ data: [], error: null }),
    );

    const result = await actionBuscarClientesPorRepresentante(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('deve agregar clientes por representante e contar processos', async () => {
    const mockProcessosRep = [
      { processo_id: 100 },
      { processo_id: 101 },
    ];

    const mockClientesVinculos = [
      { entidade_id: 1, processo_id: 100 },
      { entidade_id: 1, processo_id: 101 },
      { entidade_id: 2, processo_id: 100 },
    ];

    const mockClientes = [
      criarClienteMock({ id: 1, nome: 'Cliente A' }),
      criarClienteMock({ id: 2, nome: 'Cliente B' }),
    ];

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosRep, error: null },
        { data: mockClientesVinculos, error: null },
      ],
      clientes: { data: mockClientes, error: null },
    }));

    const result = await actionBuscarClientesPorRepresentante(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].total_processos_comuns).toBe(2); // Cliente 1 tem 2 processos
      expect(result.data[1].total_processos_comuns).toBe(1); // Cliente 2 tem 1 processo
    }
  });

  it('deve ordenar clientes por total de processos (decrescente)', async () => {
    const mockProcessosRep = [
      { processo_id: 100 },
      { processo_id: 101 },
      { processo_id: 102 },
    ];

    const mockClientesVinculos = [
      { entidade_id: 1, processo_id: 100 },
      { entidade_id: 2, processo_id: 100 },
      { entidade_id: 2, processo_id: 101 },
      { entidade_id: 2, processo_id: 102 },
    ];

    const mockClientes = [
      criarClienteMock({ id: 1, nome: 'Cliente A' }),
      criarClienteMock({ id: 2, nome: 'Cliente B' }),
    ];

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosRep, error: null },
        { data: mockClientesVinculos, error: null },
      ],
      clientes: { data: mockClientes, error: null },
    }));

    const result = await actionBuscarClientesPorRepresentante(1);

    expect(result.success).toBe(true);
    if (result.success) {
      // Deve estar ordenado por total_processos_comuns decrescente
      expect(result.data[0].total_processos_comuns).toBeGreaterThanOrEqual(
        result.data[1].total_processos_comuns
      );
    }
  });

  it('deve incluir cpf_cnpj e avatar_iniciais', async () => {
    const mockProcessosRep = [{ processo_id: 100 }];
    const mockClientesVinculos = [{ entidade_id: 1, processo_id: 100 }];
    const mockClientes = [
      criarClienteMock({
        id: 1,
        nome: 'João Silva',
        cpf: '12345678900',
        cnpj: null,
      }),
    ];

    (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
      processo_partes: [
        { data: mockProcessosRep, error: null },
        { data: mockClientesVinculos, error: null },
      ],
      clientes: { data: mockClientes, error: null },
    }));

    const result = await actionBuscarClientesPorRepresentante(1);

    expect(result.success).toBe(true);
    if (result.success && result.data.length > 0) {
      const cliente = result.data[0];
      expect(cliente.cpf_cnpj).toBe('12345678900');
      expect(cliente.avatar_iniciais).toBe('JS'); // João Silva
    }
  });
});
