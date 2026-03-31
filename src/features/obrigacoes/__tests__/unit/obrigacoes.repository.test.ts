import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';

jest.mock('@/lib/supabase/service-client');

describe('Obrigações Repository', () => {
  let mockSupabaseClient: {
    from: jest.MockedFunction<(table: string) => unknown>;
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('criarAcordo', () => {
    it('deve inserir acordo no Supabase', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: '2024-01-15',
        percentualEscritorio: 30,
      };

      // DB returns snake_case data
      const dbResult = {
        id: 1,
        processo_id: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valor_total: 10000,
        numero_parcelas: 2,
        data_vencimento_primeira_parcela: '2024-01-15',
        forma_distribuicao: 'dividido',
        percentual_escritorio: 30,
        percentual_cliente: 70,
        honorarios_sucumbenciais_total: 0,
        status: 'pendente',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        created_by: null,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acordos_condenacoes');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          processo_id: 100,
          tipo: 'acordo',
          direcao: 'recebimento',
          valor_total: 10000,
        })
      );
      // Result is mapped to camelCase
      expect(result.id).toBe(1);
      expect(result.processoId).toBe(100);
      expect(result.percentualEscritorio).toBe(30);
    });

    it('deve aplicar valores padrão (percentual 30%)', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: '2024-01-15',
      };

      // DB returns snake_case with default percentual
      const dbResult = {
        id: 1,
        processo_id: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valor_total: 10000,
        numero_parcelas: 2,
        data_vencimento_primeira_parcela: '2024-01-15',
        forma_distribuicao: null,
        percentual_escritorio: 30,
        percentual_cliente: 70,
        honorarios_sucumbenciais_total: 0,
        status: 'pendente',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        created_by: null,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(result.percentualEscritorio).toBe(30);
    });

    it('deve mapear resultado corretamente', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      };

      const dbResult = {
        id: 1,
        processo_id: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valor_total: 10000,
        numero_parcelas: 2,
        percentual_escritorio: 30,
        data_vencimento_primeira_parcela: '2024-01-15',
        intervalo_vencimento_dias: 30,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(result).toHaveProperty('processoId');
      expect(result).toHaveProperty('numeroParcelas');
      expect(result).toHaveProperty('percentualEscritorio');
      expect(result).toHaveProperty('dataVencimentoPrimeiraParcela');
    });
  });

  describe('listarAcordos', () => {
    it('deve listar com join de parcelas e acervo', async () => {
      // Arrange - DB returns snake_case with full structure
      const mockAcordos = [
        {
          id: 1,
          processo_id: 100,
          tipo: 'acordo',
          direcao: 'recebimento',
          valor_total: 10000,
          numero_parcelas: 2,
          data_vencimento_primeira_parcela: '2024-01-15',
          forma_distribuicao: 'dividido',
          percentual_escritorio: 30,
          percentual_cliente: 70,
          honorarios_sucumbenciais_total: 0,
          status: 'pendente',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          created_by: null,
          parcelas: [
            {
              id: 1,
              acordo_condenacao_id: 1,
              numero_parcela: 1,
              valor_bruto_credito_principal: 5000,
              honorarios_contratuais: 0,
              honorarios_sucumbenciais: 0,
              valor_repasse_cliente: 3500,
              data_vencimento: '2024-01-15',
              data_efetivacao: '2024-01-16',
              status: 'recebida',
              forma_pagamento: 'transferencia_direta',
              status_repasse: 'pendente_declaracao',
              editado_manualmente: false,
              arquivo_declaracao_prestacao_contas: null,
              data_declaracao_anexada: null,
              arquivo_comprovante_repasse: null,
              data_repasse: null,
              usuario_repasse_id: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
              dados_pagamento: null,
            },
            {
              id: 2,
              acordo_condenacao_id: 1,
              numero_parcela: 2,
              valor_bruto_credito_principal: 5000,
              honorarios_contratuais: 0,
              honorarios_sucumbenciais: 0,
              valor_repasse_cliente: 3500,
              data_vencimento: '2024-02-15',
              data_efetivacao: null,
              status: 'pendente',
              forma_pagamento: null,
              status_repasse: 'nao_aplicavel',
              editado_manualmente: false,
              arquivo_declaracao_prestacao_contas: null,
              data_declaracao_anexada: null,
              arquivo_comprovante_repasse: null,
              data_repasse: null,
              usuario_repasse_id: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
              dados_pagamento: null,
            },
          ],
          acervo: {
            id: 100,
            trt: '02',
            grau: 1,
            numero_processo: '0001234-56.2023.5.02.0001',
            classe_judicial: 'ATOrd',
            descricao_orgao_julgador: '1ª Vara',
            nome_parte_autora: 'João Silva',
            nome_parte_re: 'Empresa ABC',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAcordos,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        pagina: 1,
        limite: 10,
      });

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acordos_condenacoes');
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('parcelas'),
        expect.objectContaining({ count: 'exact' })
      );
      expect(result.acordos).toHaveLength(1);
    });

    it('deve aplicar filtros de tipo e status', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      // Chain eq calls
      mockEq.mockReturnValue({
        eq: mockEq,
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      await repository.listarAcordos({
        tipo: 'acordo',
        status: 'pendente',
        pagina: 1,
        limite: 10,
      });

      // Assert - uses .eq() for filters (busca textual was removed)
      expect(mockEq).toHaveBeenCalledWith('tipo', 'acordo');
      expect(mockEq).toHaveBeenCalledWith('status', 'pendente');
    });

    it('deve calcular totalParcelas e parcelasPagas', async () => {
      // Arrange - DB returns snake_case with full parcelas data
      const mockAcordos = [
        {
          id: 1,
          processo_id: 100,
          tipo: 'acordo',
          direcao: 'recebimento',
          valor_total: 15000,
          numero_parcelas: 3,
          data_vencimento_primeira_parcela: '2024-01-15',
          forma_distribuicao: 'dividido',
          percentual_escritorio: 30,
          percentual_cliente: 70,
          honorarios_sucumbenciais_total: 0,
          status: 'pago_parcial',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          created_by: null,
          parcelas: [
            {
              id: 1,
              acordo_condenacao_id: 1,
              numero_parcela: 1,
              valor_bruto_credito_principal: 5000,
              honorarios_contratuais: 0,
              honorarios_sucumbenciais: 0,
              valor_repasse_cliente: 3500,
              data_vencimento: '2024-01-15',
              data_efetivacao: '2024-01-16',
              status: 'recebida',
              forma_pagamento: 'transferencia_direta',
              status_repasse: 'repassado',
              editado_manualmente: false,
              arquivo_declaracao_prestacao_contas: null,
              data_declaracao_anexada: null,
              arquivo_comprovante_repasse: null,
              data_repasse: null,
              usuario_repasse_id: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
              dados_pagamento: null,
            },
            {
              id: 2,
              acordo_condenacao_id: 1,
              numero_parcela: 2,
              valor_bruto_credito_principal: 5000,
              honorarios_contratuais: 0,
              honorarios_sucumbenciais: 0,
              valor_repasse_cliente: 3500,
              data_vencimento: '2024-02-15',
              data_efetivacao: '2024-02-16',
              status: 'recebida',
              forma_pagamento: 'transferencia_direta',
              status_repasse: 'pendente_declaracao',
              editado_manualmente: false,
              arquivo_declaracao_prestacao_contas: null,
              data_declaracao_anexada: null,
              arquivo_comprovante_repasse: null,
              data_repasse: null,
              usuario_repasse_id: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
              dados_pagamento: null,
            },
            {
              id: 3,
              acordo_condenacao_id: 1,
              numero_parcela: 3,
              valor_bruto_credito_principal: 5000,
              honorarios_contratuais: 0,
              honorarios_sucumbenciais: 0,
              valor_repasse_cliente: 3500,
              data_vencimento: '2024-03-15',
              data_efetivacao: null,
              status: 'pendente',
              forma_pagamento: null,
              status_repasse: 'nao_aplicavel',
              editado_manualmente: false,
              arquivo_declaracao_prestacao_contas: null,
              data_declaracao_anexada: null,
              arquivo_comprovante_repasse: null,
              data_repasse: null,
              usuario_repasse_id: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
              dados_pagamento: null,
            },
          ],
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAcordos,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        pagina: 1,
        limite: 10,
      });

      // Assert
      const acordo = result.acordos[0];
      expect(acordo.totalParcelas).toBe(3);
      expect(acordo.parcelasPagas).toBe(2);
    });

    it('deve retornar paginação correta', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        pagina: 2,
        limite: 10,
      });

      // Assert
      expect(result.pagina).toBe(2);
      expect(result.limite).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPaginas).toBe(3);
      expect(mockRange).toHaveBeenCalledWith(10, 19); // page 2, skip 10, take 10
    });
  });

  describe('criarParcelas', () => {
    it('deve inserir múltiplas parcelas', async () => {
      // Arrange
      const parcelas = [
        {
          acordoCondenacaoId: 1,
          numeroParcela: 1,
          dataVencimento: '2024-01-15',
          valorBrutoCreditoPrincipal: 5000,
        },
        {
          acordoCondenacaoId: 1,
          numeroParcela: 2,
          dataVencimento: '2024-02-15',
          valorBrutoCreditoPrincipal: 5000,
        },
      ];

      // DB returns snake_case data
      const dbResult = [
        {
          id: 1,
          acordo_condenacao_id: 1,
          numero_parcela: 1,
          valor_bruto_credito_principal: 5000,
          honorarios_contratuais: 0,
          honorarios_sucumbenciais: 0,
          valor_repasse_cliente: 3500,
          data_vencimento: '2024-01-15',
          data_efetivacao: null,
          status: 'pendente',
          forma_pagamento: null,
          status_repasse: 'nao_aplicavel',
          editado_manualmente: false,
          arquivo_declaracao_prestacao_contas: null,
          data_declaracao_anexada: null,
          arquivo_comprovante_repasse: null,
          data_repasse: null,
          usuario_repasse_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          dados_pagamento: null,
        },
        {
          id: 2,
          acordo_condenacao_id: 1,
          numero_parcela: 2,
          valor_bruto_credito_principal: 5000,
          honorarios_contratuais: 0,
          honorarios_sucumbenciais: 0,
          valor_repasse_cliente: 3500,
          data_vencimento: '2024-02-15',
          data_efetivacao: null,
          status: 'pendente',
          forma_pagamento: null,
          status_repasse: 'nao_aplicavel',
          editado_manualmente: false,
          arquivo_declaracao_prestacao_contas: null,
          data_declaracao_anexada: null,
          arquivo_comprovante_repasse: null,
          data_repasse: null,
          usuario_repasse_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          dados_pagamento: null,
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await repository.criarParcelas(parcelas);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parcelas');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            acordo_condenacao_id: 1,
            numero_parcela: 1,
          }),
          expect.objectContaining({
            acordo_condenacao_id: 1,
            numero_parcela: 2,
          }),
        ])
      );
      expect(result).toHaveLength(2);
    });

    it('deve mapear campos snake_case para camelCase', async () => {
      // Arrange
      const parcelas = [
        {
          acordoCondenacaoId: 1,
          numeroParcela: 1,
          dataVencimento: '2024-01-15',
          valorBrutoCreditoPrincipal: 5000,
        },
      ];

      const dbResult = [
        {
          id: 1,
          acordo_condenacao_id: 1,
          numero_parcela: 1,
          data_vencimento: '2024-01-15',
          valor_bruto_credito_principal: 5000,
          honorarios_contratuais: 0,
          honorarios_sucumbenciais: 0,
          valor_repasse_cliente: 3500,
          data_efetivacao: null,
          status: 'pendente',
          forma_pagamento: null,
          status_repasse: 'nao_aplicavel',
          editado_manualmente: false,
          arquivo_declaracao_prestacao_contas: null,
          data_declaracao_anexada: null,
          arquivo_comprovante_repasse: null,
          data_repasse: null,
          usuario_repasse_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          dados_pagamento: null,
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await repository.criarParcelas(parcelas);

      // Assert
      expect(result[0]).toHaveProperty('acordoCondenacaoId');
      expect(result[0]).toHaveProperty('numeroParcela');
      expect(result[0]).toHaveProperty('valorBrutoCreditoPrincipal');
      expect(result[0]).toHaveProperty('valorRepasseCliente');
    });
  });

  describe('marcarParcelaComoRecebida', () => {
    it('deve atualizar status e data', async () => {
      // Arrange
      const parcelaId = 1;
      const dados = {
        dataEfetivacao: '2024-01-16',
        valor: 5000,
      };

      // DB returns snake_case data
      const dbResult = {
        id: parcelaId,
        acordo_condenacao_id: 1,
        numero_parcela: 1,
        valor_bruto_credito_principal: 5000,
        honorarios_contratuais: 0,
        honorarios_sucumbenciais: 0,
        valor_repasse_cliente: 3500,
        data_vencimento: '2024-01-15',
        data_efetivacao: '2024-01-16',
        status: 'recebida',
        forma_pagamento: 'transferencia_direta',
        status_repasse: 'pendente_declaracao',
        editado_manualmente: false,
        arquivo_declaracao_prestacao_contas: null,
        data_declaracao_anexada: null,
        arquivo_comprovante_repasse: null,
        data_repasse: null,
        usuario_repasse_id: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        dados_pagamento: null,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.marcarParcelaComoRecebida(parcelaId, dados);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parcelas');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'recebida',
          data_efetivacao: '2024-01-16',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', parcelaId);
      expect(result.status).toBe('recebida');
    });

    it('deve atualizar valor se fornecido', async () => {
      // Arrange
      const parcelaId = 1;
      const dados = {
        dataEfetivacao: '2024-01-16',
        valor: 4800,
      };

      // DB returns snake_case data
      const dbResult = {
        id: parcelaId,
        acordo_condenacao_id: 1,
        numero_parcela: 1,
        valor_bruto_credito_principal: 4800,
        honorarios_contratuais: 0,
        honorarios_sucumbenciais: 0,
        valor_repasse_cliente: 3360,
        data_vencimento: '2024-01-15',
        data_efetivacao: '2024-01-16',
        status: 'recebida',
        forma_pagamento: null,
        status_repasse: 'pendente_declaracao',
        editado_manualmente: false,
        arquivo_declaracao_prestacao_contas: null,
        data_declaracao_anexada: null,
        arquivo_comprovante_repasse: null,
        data_repasse: null,
        usuario_repasse_id: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        dados_pagamento: null,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await repository.marcarParcelaComoRecebida(parcelaId, dados);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_bruto_credito_principal: 4800,
        })
      );
    });
  });

  describe('listarRepassesPendentes', () => {
    it('deve buscar da view repasses_pendentes', async () => {
      // Arrange - DB returns snake_case data matching RepassePendenteDB
      const mockRepasses = [
        {
          parcela_id: 1,
          acordo_condenacao_id: 1,
          numero_parcela: 1,
          valor_bruto_credito_principal: 5000,
          valor_repasse_cliente: 3500,
          status_repasse: 'pendente_declaracao',
          data_efetivacao: '2024-01-16',
          arquivo_declaracao_prestacao_contas: null,
          data_declaracao_anexada: null,
          processo_id: 100,
          tipo: 'acordo',
          acordo_valor_total: 10000,
          percentual_cliente: 70,
          acordo_numero_parcelas: 2,
        },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockRepasses,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await repository.listarRepassesPendentes();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('repasses_pendentes');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('parcelaId');
      expect(result[0]).toHaveProperty('valorRepasseCliente');
    });

    it('deve aplicar filtros de status e data', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockLte = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        gte: mockGte,
      });

      mockGte.mockReturnValue({
        lte: mockLte,
      });

      // Act - use correct parameter names from FiltrosRepasses
      await repository.listarRepassesPendentes({
        statusRepasse: 'pendente_declaracao',
        dataInicio: '2024-01-01',
        dataFim: '2024-01-31',
      });

      // Assert - uses data_efetivacao column
      expect(mockEq).toHaveBeenCalledWith('status_repasse', 'pendente_declaracao');
      expect(mockGte).toHaveBeenCalledWith(
        'data_efetivacao',
        '2024-01-01'
      );
      expect(mockLte).toHaveBeenCalledWith(
        'data_efetivacao',
        '2024-01-31'
      );
    });
  });
});
