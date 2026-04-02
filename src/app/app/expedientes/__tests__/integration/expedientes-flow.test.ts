/**
 * EXPEDIENTES INTEGRATION TESTS
 *
 * Testa fluxos completos de criação, baixa, reversão e auditoria de expedientes,
 * incluindo integrações com RPC e validações entre camadas.
 */

import {
  criarExpediente,
  realizarBaixa,
  reverterBaixa,
  atribuirResponsavel,
  listarExpedientes,
} from '../../service';
import { GrauTribunal, OrigemExpediente } from '../../domain';
import {
  saveExpediente,
  findExpedienteById,
  baixarExpediente,
  reverterBaixaExpediente,
  processoExists,
  tipoExpedienteExists,
  findAllExpedientes,
} from '../../repository';
import { ok } from '@/types';
import { mockExpediente, assertPaginationCorrect, buildMultipleExpedientes } from '@/testing/integration-helpers';
import { createDbClient } from '@/lib/supabase';

// Mock repository e Supabase
jest.mock('../../repository');
jest.mock('@/lib/supabase');

describe('Expedientes Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar expediente com validação de processo', async () => {
    // Arrange: Mock processoExists e saveExpediente
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      processoId: 1,
    };

    const expectedExpediente = mockExpediente({
      id: 1,
      numeroProcesso: input.numeroProcesso,
      processoId: 1,
    });

    (processoExists as jest.Mock).mockResolvedValue(ok(true));
    (saveExpediente as jest.Mock).mockResolvedValue(ok(expectedExpediente));

    // Act: Chamar criarExpediente
    const result = await criarExpediente(input);

    // Assert: Verificar validação de processo
    expect(result.success).toBe(true);
    expect(processoExists).toHaveBeenCalledWith(1);
    expect(saveExpediente).toHaveBeenCalledWith(
      expect.objectContaining({
        numero_processo: input.numeroProcesso,
        processo_id: 1,
      })
    );

    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.processoId).toBe(1);
    }
  });

  it('deve validar tipo de expediente se fornecido', async () => {
    // Arrange: Mock tipoExpedienteExists
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      tipoExpedienteId: 5,
    };

    (tipoExpedienteExists as jest.Mock).mockResolvedValue(ok(false));

    // Act: Criar com tipoExpedienteId
    const result = await criarExpediente(input);

    // Assert: Verificar validação
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Tipo de expediente');
    }
    expect(saveExpediente).not.toHaveBeenCalled();
  });

  it('deve falhar se processo não existir', async () => {
    // Arrange
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      processoId: 999,
    };

    (processoExists as jest.Mock).mockResolvedValue(ok(false));

    // Act
    const result = await criarExpediente(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Processo');
    }
  });

  it('deve criar expediente sem validações opcionais', async () => {
    // Arrange: Input mínimo
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
    };

    const expectedExpediente = mockExpediente();
    (saveExpediente as jest.Mock).mockResolvedValue(ok(expectedExpediente));

    // Act
    const result = await criarExpediente(input);

    // Assert
    expect(result.success).toBe(true);
    expect(processoExists).not.toHaveBeenCalled(); // Sem processoId, não valida
    expect(tipoExpedienteExists).not.toHaveBeenCalled(); // Sem tipoExpedienteId, não valida
    expect(saveExpediente).toHaveBeenCalled();
  });
});

describe('Expedientes Integration - Baixa', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getSession: jest.MockedFunction<() => Promise<{ data: { session: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock createDbClient
    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getSession: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve realizar baixa e registrar auditoria via RPC', async () => {
    // Arrange: Mock findExpedienteById, baixarExpediente, db.rpc
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: null, // Não baixado
    });

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    };

    const expedienteBaixado = mockExpediente({
      ...expediente,
      baixadoEm: new Date().toISOString(),
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (baixarExpediente as jest.Mock).mockResolvedValue(ok(expedienteBaixado));

    // Act: Chamar realizarBaixa
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert: Verificar chamada a registrar_baixa_expediente
    expect(result.success).toBe(true);
    expect(findExpedienteById).toHaveBeenCalledWith(1);
    expect(baixarExpediente).toHaveBeenCalledWith(1, {
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
      baixadoEm: undefined,
    });
    expect(mockDb.rpc).toHaveBeenCalledWith('registrar_baixa_expediente', {
      p_expediente_id: 1,
      p_usuario_id: 1,
      p_protocolo_id: 'PROT-12345',
      p_justificativa: 'Protocolo realizado',
    });

    if (result.success) {
      expect(result.data.baixadoEm).not.toBeNull();
    }
  });

  it('deve falhar se expediente já estiver baixado', async () => {
    // Arrange: Mock expediente com baixadoEm preenchido
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: '2024-01-15T10:00:00Z',
      protocoloId: 'PROT-ANTERIOR',
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
    };

    // Act: Tentar baixar novamente
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert: Verificar erro BAD_REQUEST
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toContain('já está baixado');
    }
    expect(baixarExpediente).not.toHaveBeenCalled();
    expect(mockDb.rpc).not.toHaveBeenCalled();
  });

  it('deve continuar se RPC de auditoria falhar (log crítico)', async () => {
    // Arrange: Mock RPC retornando erro
    const expediente = mockExpediente({ id: 1, baixadoEm: null });
    const expedienteBaixado = mockExpediente({ ...expediente, baixadoEm: new Date().toISOString() });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (baixarExpediente as jest.Mock).mockResolvedValue(ok(expedienteBaixado));

    const rpcError = { message: 'RPC falhou', code: 'RPC_ERROR' };
    mockDb.rpc.mockResolvedValue({ data: null, error: rpcError });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
    };

    // Act: Realizar baixa
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert: Verificar baixa concluída + log de erro
    expect(result.success).toBe(true);
    expect(baixarExpediente).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CRITICAL]'),
      expect.objectContaining({
        expedienteId: 1,
        userId: 1,
        rpcError,
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it('deve validar dados de entrada antes de baixar', async () => {
    // Arrange: Input inválido (nem protocoloId nem justificativa)
    const baixaInput = {
      expedienteId: 1,
    };

    // Act
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(findExpedienteById).not.toHaveBeenCalled();
  });
});

describe('Expedientes Integration - Reversão', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getSession: jest.MockedFunction<() => Promise<{ data: { session: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: { getSession: jest.fn() },
      from: jest.fn().mockReturnThis(),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve reverter baixa e registrar auditoria', async () => {
    // Arrange: Mock expediente baixado + reverterBaixaExpediente
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: '2024-01-15T10:00:00Z',
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    });

    const expedienteRevertido = mockExpediente({
      ...expediente,
      baixadoEm: null,
      protocoloId: null,
      justificativaBaixa: null,
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (reverterBaixaExpediente as jest.Mock).mockResolvedValue(ok(expedienteRevertido));

    // Act: Chamar reverterBaixa
    const result = await reverterBaixa(1, 1);

    // Assert: Verificar chamada a registrar_reversao_baixa_expediente
    expect(result.success).toBe(true);
    expect(findExpedienteById).toHaveBeenCalledWith(1);
    expect(reverterBaixaExpediente).toHaveBeenCalledWith(1);
    expect(mockDb.rpc).toHaveBeenCalledWith('registrar_reversao_baixa_expediente', {
      p_expediente_id: 1,
      p_usuario_id: 1,
      p_protocolo_id_anterior: 'PROT-12345',
      p_justificativa_anterior: 'Protocolo realizado',
    });

    if (result.success) {
      expect(result.data.baixadoEm).toBeNull();
    }
  });

  it('deve falhar se expediente não estiver baixado', async () => {
    // Arrange: Mock expediente sem baixadoEm
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: null,
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));

    // Act: Tentar reverter
    const result = await reverterBaixa(1, 1);

    // Assert: Verificar erro BAD_REQUEST
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toContain('não está baixado');
    }
    expect(reverterBaixaExpediente).not.toHaveBeenCalled();
    expect(mockDb.rpc).not.toHaveBeenCalled();
  });

  it('deve continuar se RPC de reversão falhar (com log)', async () => {
    // Arrange
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: '2024-01-15T10:00:00Z',
      protocoloId: 'PROT-12345',
    });

    const expedienteRevertido = mockExpediente({ ...expediente, baixadoEm: null });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (reverterBaixaExpediente as jest.Mock).mockResolvedValue(ok(expedienteRevertido));

    const rpcError = { message: 'RPC falhou', code: 'RPC_ERROR' };
    mockDb.rpc.mockResolvedValue({ data: null, error: rpcError });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    const result = await reverterBaixa(1, 1);

    // Assert
    expect(result.success).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao registrar log de reversão'),
      rpcError
    );

    consoleErrorSpy.mockRestore();
  });

  it('deve falhar se expediente não encontrado', async () => {
    // Arrange
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(null));

    // Act
    const result = await reverterBaixa(999, 1);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

describe('Expedientes Integration - Atribuição de Responsável', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getSession: jest.MockedFunction<() => Promise<{ data: { session: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'auth-user-123' } } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
      }),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve atribuir responsável via RPC', async () => {
    // Arrange: Mock db.rpc('atribuir_responsavel_pendente')
    // Act: Chamar atribuirResponsavel
    const result = await atribuirResponsavel(1, 5);

    // Assert: Verificar chamada RPC com parâmetros corretos
    expect(result.success).toBe(true);
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: 5,
      p_usuario_executou_id: 1,
    });
  });

  it('deve permitir remover responsável (null)', async () => {
    // Act
    const result = await atribuirResponsavel(1, null);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: null,
      p_usuario_executou_id: 1,
    });
  });

  it('deve falhar se RPC retornar erro', async () => {
    // Arrange
    const rpcError = { message: 'Expediente não encontrado', code: 'P0001' };
    mockDb.rpc.mockResolvedValue({ data: null, error: rpcError });

    // Act
    const result = await atribuirResponsavel(999, 5);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toContain('Expediente não encontrado');
    }
  });

  it('deve usar usuarioExecutouId se fornecido', async () => {
    // Act: Passar usuarioExecutouId explicitamente
    await atribuirResponsavel(1, 5, 99);

    // Assert: Verificar que não busca sessão
    expect(mockDb.auth.getSession).not.toHaveBeenCalled();
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: 5,
      p_usuario_executou_id: 99,
    });
  });
});

describe('Expedientes Integration - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar expedientes com paginação', async () => {
    // Arrange
    const expedientes = buildMultipleExpedientes(20);
    const paginatedResponse = {
      data: expedientes.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasMore: true,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act
    const result = await listarExpedientes({ pagina: 1, limite: 10 });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      assertPaginationCorrect(result.data, 1, 10, 20);
      expect(result.data.data).toHaveLength(10);
    }
  });

  it('deve aplicar filtros de TRT, grau e baixado', async () => {
    // Arrange
    const expedientes = buildMultipleExpedientes(3, {
      trt: 'TRT2',
      grau: 'segundo_grau',
      baixadoEm: null,
    });

    const paginatedResponse = {
      data: expedientes,
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        totalPages: 1,
        hasMore: false,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act
    const result = await listarExpedientes({
      trt: 'TRT2',
      grau: GrauTribunal.SEGUNDO_GRAU,
      baixado: false,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        trt: 'TRT2',
        grau: GrauTribunal.SEGUNDO_GRAU,
        baixado: false,
        pagina: 1,
        limite: 50,
      })
    );
  });

  it('deve sanitizar parâmetros de paginação', async () => {
    // Arrange
    const paginatedResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Valores fora dos limites
    const result = await listarExpedientes({
      pagina: -10,
      limite: 500,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1, // Sanitizado
        limite: 50, // Sanitizado (fallback quando inválido)
      })
    );
  });

  it('deve aplicar ordenação padrão por data_prazo_legal_parte asc', async () => {
    // Arrange
    const paginatedResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Sem especificar ordenação
    const result = await listarExpedientes({});

    // Assert: Verificar defaults
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        ordenarPor: 'data_prazo_legal_parte',
        ordem: 'asc',
      })
    );
  });
});
