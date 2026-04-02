/**
 * RH INTEGRATION TESTS - FOLHA DE PAGAMENTO
 *
 * Testa fluxo completo de folha de pagamento (gerar → aprovar → pagar → cancelar)
 * com validações complexas e criação de lançamentos financeiros.
 */

import {
  gerarFolhaPagamento,
  aprovarFolhaPagamento,
  pagarFolhaPagamento,
  cancelarFolhaPagamento,
} from '../../service';
import {
  verificarFolhaExistente,
  buscarSalariosVigentesNoMes,
  criarFolhaPagamento,
  criarItemFolha,
  atualizarValorTotalFolha,
  buscarFolhaPorId,
  atualizarStatusFolha,
  vincularLancamentoAoItem,
} from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { FolhaPagamentoComDetalhes, ItemFolhaComDetalhes } from '../../domain';

// Mock repository e Supabase
jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client');

describe('RH Integration - Geração de Folha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSalariosVigentes = [
    {
      id: 1,
      usuarioId: 10,
      salarioBruto: 5000,
      usuario: { nomeExibicao: 'João Silva' },
    },
    {
      id: 2,
      usuarioId: 20,
      salarioBruto: 3000,
      usuario: { nomeExibicao: 'Maria Santos' },
    },
  ];

  it('deve gerar folha com salários vigentes', async () => {
    // Arrange: Mock verificarFolhaExistente, buscarSalariosVigentesNoMes, criarFolhaPagamento, criarItemFolha
    const input = {
      mesReferencia: 1,
      anoReferencia: 2024,
      observacoes: 'Folha de janeiro/2024',
    };

    const mockFolha: FolhaPagamentoComDetalhes = {
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'rascunho',
      valorTotal: 8000,
      dataPagamento: null,
      observacoes: 'Folha de janeiro/2024',
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [
        {
          id: 1,
          folhaId: 1,
          usuarioId: 10,
          salarioId: 1,
          valorBruto: 5000,
          lancamentoFinanceiroId: null,
          createdAt: new Date().toISOString(),
          usuario: { nomeExibicao: 'João Silva' },
        } as ItemFolhaComDetalhes,
        {
          id: 2,
          folhaId: 1,
          usuarioId: 20,
          salarioId: 2,
          valorBruto: 3000,
          lancamentoFinanceiroId: null,
          createdAt: new Date().toISOString(),
          usuario: { nomeExibicao: 'Maria Santos' },
        } as ItemFolhaComDetalhes,
      ],
    };

    (verificarFolhaExistente as jest.Mock).mockResolvedValue(false);
    (buscarSalariosVigentesNoMes as jest.Mock).mockResolvedValue(mockSalariosVigentes);
    (criarFolhaPagamento as jest.Mock).mockResolvedValue({
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'rascunho',
    });
    (criarItemFolha as jest.Mock).mockResolvedValue({});
    (atualizarValorTotalFolha as jest.Mock).mockResolvedValue({});
    (buscarFolhaPorId as jest.Mock).mockResolvedValue(mockFolha);

    // Act: Chamar gerarFolhaPagamento
    const result = await gerarFolhaPagamento(input, 1);

    // Assert: Verificar criação de folha + itens para cada salário
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.valorTotal).toBe(8000);
    expect(result.itens).toHaveLength(2);
    expect(verificarFolhaExistente).toHaveBeenCalledWith(1, 2024);
    expect(buscarSalariosVigentesNoMes).toHaveBeenCalledWith(1, 2024);
    expect(criarFolhaPagamento).toHaveBeenCalled();
    expect(criarItemFolha).toHaveBeenCalledTimes(2);
    expect(criarItemFolha).toHaveBeenCalledWith(1, 10, 1, 5000, undefined);
    expect(criarItemFolha).toHaveBeenCalledWith(1, 20, 2, 3000, undefined);
    expect(atualizarValorTotalFolha).toHaveBeenCalledWith(1);
  });

  it('deve falhar se folha já existir para o período', async () => {
    // Arrange: Mock verificarFolhaExistente retornando true
    const input = {
      mesReferencia: 1,
      anoReferencia: 2024,
    };

    (verificarFolhaExistente as jest.Mock).mockResolvedValue(true);

    // Act & Assert: Tentar gerar folha
    await expect(gerarFolhaPagamento(input, 1))
      .rejects
      .toThrow(/Já existe uma folha de pagamento para/);

    expect(buscarSalariosVigentesNoMes).not.toHaveBeenCalled();
    expect(criarFolhaPagamento).not.toHaveBeenCalled();
  });

  it('deve falhar se não houver salários vigentes', async () => {
    // Arrange: Mock buscarSalariosVigentesNoMes retornando []
    const input = {
      mesReferencia: 1,
      anoReferencia: 2024,
    };

    (verificarFolhaExistente as jest.Mock).mockResolvedValue(false);
    (buscarSalariosVigentesNoMes as jest.Mock).mockResolvedValue([]);

    // Act & Assert: Tentar gerar folha
    await expect(gerarFolhaPagamento(input, 1))
      .rejects
      .toThrow(/Não há funcionários com salário vigente/);

    expect(criarFolhaPagamento).not.toHaveBeenCalled();
  });

  it('deve continuar se alguns itens falharem (erros parciais)', async () => {
    // Arrange: Mock criarItemFolha falhando para 1 de 2 salários
    const input = {
      mesReferencia: 1,
      anoReferencia: 2024,
    };

    const mockFolhaComUmItem: FolhaPagamentoComDetalhes = {
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'rascunho',
      valorTotal: 5000,
      dataPagamento: null,
      observacoes: null,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [
        {
          id: 1,
          folhaId: 1,
          usuarioId: 10,
          salarioId: 1,
          valorBruto: 5000,
          lancamentoFinanceiroId: null,
          createdAt: new Date().toISOString(),
          usuario: { nomeExibicao: 'João Silva' },
        } as ItemFolhaComDetalhes,
      ],
    };

    (verificarFolhaExistente as jest.Mock).mockResolvedValue(false);
    (buscarSalariosVigentesNoMes as jest.Mock).mockResolvedValue(mockSalariosVigentes);
    (criarFolhaPagamento as jest.Mock).mockResolvedValue({ id: 1 });
    (criarItemFolha as jest.Mock)
      .mockResolvedValueOnce({}) // 1º salário OK
      .mockRejectedValueOnce(new Error('Erro ao criar item')); // 2º salário falha
    (atualizarValorTotalFolha as jest.Mock).mockResolvedValue({});
    (buscarFolhaPorId as jest.Mock).mockResolvedValue(mockFolhaComUmItem);

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Act: Gerar folha
    const result = await gerarFolhaPagamento(input, 1);

    // Assert: Verificar folha criada com 1 item + log de erro
    expect(result).toBeDefined();
    expect(result.itens).toHaveLength(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('gerada com 1 erros parciais'),
      expect.any(Array)
    );

    consoleWarnSpy.mockRestore();
  });

  it('deve validar período inválido', async () => {
    // Arrange: Período inválido (mês 13)
    const input = {
      mesReferencia: 13,
      anoReferencia: 2024,
    };

    // Act & Assert
    await expect(gerarFolhaPagamento(input, 1))
      .rejects
      .toThrow(/Mês deve estar entre 1 e 12/);
  });
});

describe('RH Integration - Aprovação', () => {
  let mockSupabase: {
    from: jest.MockedFunction<(table: string) => unknown>;
    select: jest.MockedFunction<(...args: unknown[]) => unknown>;
    [key: string]: unknown;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock createServiceClient
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const mockFolhaRascunho: FolhaPagamentoComDetalhes = {
    id: 1,
    mesReferencia: 1,
    anoReferencia: 2024,
    status: 'rascunho',
    valorTotal: 8000,
    dataPagamento: null,
    observacoes: null,
    createdBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itens: [
      {
        id: 1,
        folhaId: 1,
        usuarioId: 10,
        salarioId: 1,
        valorBruto: 5000,
        lancamentoFinanceiroId: null,
        createdAt: new Date().toISOString(),
        usuario: { nomeExibicao: 'João Silva' },
      } as ItemFolhaComDetalhes,
      {
        id: 2,
        folhaId: 1,
        usuarioId: 20,
        salarioId: 2,
        valorBruto: 3000,
        lancamentoFinanceiroId: null,
        createdAt: new Date().toISOString(),
        usuario: { nomeExibicao: 'Maria Santos' },
      } as ItemFolhaComDetalhes,
    ],
  };

  it('deve aprovar folha e criar lançamentos financeiros', async () => {
    // Arrange: Mock buscarFolhaPorId, validações de conta/centro custo, db.from('lancamentos_financeiros').insert
    const aprovarInput = {
      contaContabilId: 100,
      contaBancariaId: 10,
      centroCustoId: 5,
    };

    (buscarFolhaPorId as jest.Mock)
      .mockResolvedValueOnce(mockFolhaRascunho)
      .mockResolvedValueOnce({
        ...mockFolhaRascunho,
        status: 'aprovada',
      });

    // Mock validações de conta contábil
    mockSupabase.single
      .mockResolvedValueOnce({
        data: {
          id: 100,
          codigo: '1.1.1',
          nome: 'Despesas com Pessoal',
          aceita_lancamento: true,
          ativo: true,
        },
        error: null,
      })
      // Mock conta bancária
      .mockResolvedValueOnce({
        data: { id: 10, nome: 'Banco XYZ', ativo: true },
        error: null,
      })
      // Mock centro de custo
      .mockResolvedValueOnce({
        data: { id: 5, nome: 'Administrativo', ativo: true },
        error: null,
      })
      // Mock insert().select().single() chain for financial entries
      .mockResolvedValue({
        data: { id: 1000 },
        error: null,
      });

    (atualizarStatusFolha as jest.Mock).mockResolvedValue({});
    (vincularLancamentoAoItem as jest.Mock).mockResolvedValue({});

    // Act: Chamar aprovarFolhaPagamento
    const result = await aprovarFolhaPagamento(1, aprovarInput, 1);

    // Assert: Verificar criação de lançamentos + status 'aprovada'
    expect(result.status).toBe('aprovada');
    expect(buscarFolhaPorId).toHaveBeenCalledWith(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('plano_contas');
    expect(mockSupabase.from).toHaveBeenCalledWith('contas_bancarias');
    expect(mockSupabase.from).toHaveBeenCalledWith('centros_custo');
    expect(mockSupabase.from).toHaveBeenCalledWith('lancamentos_financeiros');
    expect(mockSupabase.insert).toHaveBeenCalledTimes(2); // 2 lançamentos
    expect(vincularLancamentoAoItem).toHaveBeenCalledTimes(2);
    expect(atualizarStatusFolha).toHaveBeenCalledWith(1, 'aprovada', expect.any(Object));
  });

  it('deve validar conta contábil analítica', async () => {
    // Arrange: Mock conta sintética (aceita_lancamento = false)
    const aprovarInput = {
      contaContabilId: 100,
      contaBancariaId: 10,
    };

    (buscarFolhaPorId as jest.Mock).mockResolvedValue(mockFolhaRascunho);

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 100,
        codigo: '1.1',
        nome: 'Despesas',
        aceita_lancamento: false, // Conta sintética
        ativo: true,
      },
      error: null,
    });

    // Act & Assert: Tentar aprovar
    await expect(aprovarFolhaPagamento(1, aprovarInput, 1))
      .rejects
      .toThrow(/sintética e não aceita lançamentos/);

    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });

  it('deve vincular lançamentos aos itens da folha', async () => {
    // Arrange: Mock vincularLancamentoAoItem
    const aprovarInput = {
      contaContabilId: 100,
      contaBancariaId: 10,
    };

    (buscarFolhaPorId as jest.Mock)
      .mockResolvedValueOnce(mockFolhaRascunho)
      .mockResolvedValueOnce({ ...mockFolhaRascunho, status: 'aprovada' });

    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 100, aceita_lancamento: true, ativo: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 10, ativo: true },
        error: null,
      })
      .mockResolvedValue({
        data: { id: 1000 },
        error: null,
      });

    (vincularLancamentoAoItem as jest.Mock).mockResolvedValue({});
    (atualizarStatusFolha as jest.Mock).mockResolvedValue({});

    // Act: Aprovar folha
    await aprovarFolhaPagamento(1, aprovarInput, 1);

    // Assert: Verificar vinculação de cada item
    expect(vincularLancamentoAoItem).toHaveBeenCalledWith(1, 1000);
    expect(vincularLancamentoAoItem).toHaveBeenCalledWith(2, 1000);
  });

  it('deve falhar se folha não estiver em rascunho', async () => {
    // Arrange
    (buscarFolhaPorId as jest.Mock).mockResolvedValue({
      ...mockFolhaRascunho,
      status: 'aprovada',
    });

    // Act & Assert
    await expect(aprovarFolhaPagamento(1, { contaContabilId: 100, contaBancariaId: 10 }, 1))
      .rejects
      .toThrow(/Apenas folhas em rascunho podem ser aprovadas/);
  });
});

describe('RH Integration - Pagamento', () => {
  let mockSupabase: {
    from: jest.MockedFunction<(table: string) => unknown>;
    select: jest.MockedFunction<(...args: unknown[]) => unknown>;
    eq: jest.MockedFunction<(...args: unknown[]) => unknown>;
    [key: string]: unknown;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const mockFolhaAprovada: FolhaPagamentoComDetalhes = {
    id: 1,
    mesReferencia: 1,
    anoReferencia: 2024,
    status: 'aprovada',
    valorTotal: 8000,
    dataPagamento: null,
    observacoes: null,
    createdBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itens: [
      {
        id: 1,
        folhaId: 1,
        usuarioId: 10,
        salarioId: 1,
        valorBruto: 5000,
        lancamentoFinanceiroId: 1000,
        createdAt: new Date().toISOString(),
        usuario: { nomeExibicao: 'João Silva' },
        lancamento: { id: 1000, status: 'pendente', descricao: 'Salário João' },
      } as ItemFolhaComDetalhes,
    ],
  };

  it('deve pagar folha e atualizar lançamentos para confirmado', async () => {
    // Arrange: Mock folha aprovada + db.from('lancamentos_financeiros').update
    const pagarInput = {
      contaBancariaId: 10,
      formaPagamento: 'pix',
      observacoes: 'Pagamento realizado',
    };

    (buscarFolhaPorId as jest.Mock)
      .mockResolvedValueOnce(mockFolhaAprovada)
      .mockResolvedValueOnce({
        ...mockFolhaAprovada,
        status: 'paga',
      });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 10, nome: 'Banco XYZ', ativo: true },
      error: null,
    });

    (atualizarStatusFolha as jest.Mock).mockResolvedValue({});

    // Act: Chamar pagarFolhaPagamento
    const result = await pagarFolhaPagamento(1, pagarInput);

    // Assert: Verificar status 'confirmado' nos lançamentos
    expect(result.status).toBe('paga');
    expect(mockSupabase.from).toHaveBeenCalledWith('lancamentos_financeiros');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'confirmado',
      forma_pagamento: 'pix',
      conta_bancaria_id: 10,
      data_efetivacao: expect.any(String),
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1000);
    expect(atualizarStatusFolha).toHaveBeenCalledWith(1, 'paga', expect.any(Object));
  });

  it('deve falhar se folha não estiver aprovada', async () => {
    // Arrange: Mock folha com status 'rascunho'
    (buscarFolhaPorId as jest.Mock).mockResolvedValue({
      ...mockFolhaAprovada,
      status: 'rascunho',
    });

    const pagarInput = {
      contaBancariaId: 10,
      formaPagamento: 'pix',
    };

    // Act & Assert: Tentar pagar
    await expect(pagarFolhaPagamento(1, pagarInput))
      .rejects
      .toThrow(/Apenas folhas aprovadas podem ser pagas/);

    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('deve falhar se existirem itens sem lançamento', async () => {
    // Arrange
    const folhaSemLancamentos: FolhaPagamentoComDetalhes = {
      ...mockFolhaAprovada,
      itens: [
        {
          id: 1,
          folhaId: 1,
          usuarioId: 10,
          salarioId: 1,
          valorBruto: 5000,
          lancamentoFinanceiroId: null, // Sem lançamento!
          createdAt: new Date().toISOString(),
          usuario: { nomeExibicao: 'João Silva' },
        } as ItemFolhaComDetalhes,
      ],
    };

    (buscarFolhaPorId as jest.Mock).mockResolvedValue(folhaSemLancamentos);

    // Act & Assert
    await expect(pagarFolhaPagamento(1, { contaBancariaId: 10, formaPagamento: 'pix' }))
      .rejects
      .toThrow(/itens sem lançamento financeiro vinculado/);
  });
});

describe('RH Integration - Cancelamento', () => {
  let mockSupabase: {
    from: jest.MockedFunction<(table: string) => unknown>;
    select: jest.MockedFunction<(...args: unknown[]) => unknown>;
    single: jest.MockedFunction<(...args: unknown[]) => unknown>;
    update: jest.MockedFunction<(...args: unknown[]) => unknown>;
    eq: jest.MockedFunction<(...args: unknown[]) => unknown>;
    [key: string]: unknown;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ error: null }),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('deve cancelar folha em rascunho', async () => {
    // Arrange: Mock folha rascunho
    const mockFolhaRascunho: FolhaPagamentoComDetalhes = {
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'rascunho',
      valorTotal: 8000,
      dataPagamento: null,
      observacoes: null,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [],
    };

    (buscarFolhaPorId as jest.Mock)
      .mockResolvedValueOnce(mockFolhaRascunho)
      .mockResolvedValueOnce({
        ...mockFolhaRascunho,
        status: 'cancelada',
      });

    (atualizarStatusFolha as jest.Mock).mockResolvedValue({});

    // Act: Chamar cancelarFolhaPagamento
    const result = await cancelarFolhaPagamento(1, 'Motivo do cancelamento');

    // Assert: Verificar status 'cancelada'
    expect(result.status).toBe('cancelada');
    expect(atualizarStatusFolha).toHaveBeenCalledWith(1, 'cancelada', expect.any(Object));
  });

  it('deve cancelar lançamentos se folha aprovada', async () => {
    // Arrange: Mock folha aprovada com lançamentos pendentes
    const mockFolhaAprovada: FolhaPagamentoComDetalhes = {
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'aprovada',
      valorTotal: 8000,
      dataPagamento: null,
      observacoes: null,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [
        {
          id: 1,
          folhaId: 1,
          usuarioId: 10,
          salarioId: 1,
          valorBruto: 5000,
          lancamentoFinanceiroId: 1000,
          createdAt: new Date().toISOString(),
          usuario: { nomeExibicao: 'João Silva' },
          lancamento: { id: 1000, status: 'pendente' },
        } as ItemFolhaComDetalhes,
      ],
    };

    (buscarFolhaPorId as jest.Mock)
      .mockResolvedValueOnce(mockFolhaAprovada)
      .mockResolvedValueOnce({
        ...mockFolhaAprovada,
        status: 'cancelada',
      });

    mockSupabase.single.mockResolvedValue({
      data: { status: 'pendente', observacoes: null },
      error: null,
    });

    (atualizarStatusFolha as jest.Mock).mockResolvedValue({});

    // Act: Cancelar folha
    const result = await cancelarFolhaPagamento(1, 'Erro na aprovação');

    // Assert: Verificar lançamentos marcados como 'cancelado'
    expect(result.status).toBe('cancelada');
    expect(mockSupabase.from).toHaveBeenCalledWith('lancamentos_financeiros');
    expect(mockSupabase.select).toHaveBeenCalledWith('status, observacoes');
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelado' })
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1000);
  });

  it('deve falhar se folha já estiver paga', async () => {
    // Arrange: Mock folha com status 'paga'
    const mockFolhaPaga: FolhaPagamentoComDetalhes = {
      id: 1,
      mesReferencia: 1,
      anoReferencia: 2024,
      status: 'paga',
      valorTotal: 8000,
      dataPagamento: '2024-01-31',
      observacoes: null,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [],
    };

    (buscarFolhaPorId as jest.Mock).mockResolvedValue(mockFolhaPaga);

    // Act & Assert: Tentar cancelar
    await expect(cancelarFolhaPagamento(1, 'Motivo'))
      .rejects
      .toThrow(/Não é possível cancelar uma folha já paga/);

    expect(atualizarStatusFolha).not.toHaveBeenCalled();
  });

  it('deve falhar se folha não encontrada', async () => {
    // Arrange
    (buscarFolhaPorId as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(cancelarFolhaPagamento(999, 'Motivo'))
      .rejects
      .toThrow(/não encontrada/);
  });
});
