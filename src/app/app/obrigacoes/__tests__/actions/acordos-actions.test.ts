import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionCriarAcordoComParcelas,
  actionBuscarAcordosPorCPF,
  actionBuscarAcordosPorNumeroProcesso,
  actionListarAcordos,
} from '../../actions/acordos';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import { criarAcordoMock, criarParcelaMock } from '../fixtures';

jest.mock('../../service');
jest.mock('next/cache');

describe('Acordos Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionCriarAcordoComParcelas', () => {
    it('deve validar schema Zod e retornar erro para dados inválidos', async () => {
      // Act - pass invalid data (missing required fields, etc.)
      const result = await actionCriarAcordoComParcelas({
        processoId: -1,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: -100,
        numeroParcelas: 0,
      });

      // Assert - the action does its own Zod validation
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve chamar service com parâmetros corretos', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        processoId: 100,
        tipo: 'condenacao',
        direcao: 'pagamento',
        valorTotal: 15000,
        numeroParcelas: 3,
      });

      const parcelas = Array.from({ length: 3 }, (_, i) =>
        criarParcelaMock({ id: i + 1, numeroParcela: i + 1 })
      );

      (service.criarAcordoComParcelas as jest.Mock).mockResolvedValue({
        ...acordo,
        parcelas,
      });

      // Act
      const result = await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'condenacao',
        direcao: 'pagamento',
        valorTotal: 15000,
        numeroParcelas: 3,
        dataVencimentoPrimeiraParcela: '2024-02-01',
        percentualEscritorio: 40,
        formaPagamentoPadrao: 'transferencia_direta',
      });

      // Assert
      expect(service.criarAcordoComParcelas).toHaveBeenCalledWith(
        expect.objectContaining({
          processoId: 100,
          tipo: 'condenacao',
          direcao: 'pagamento',
          valorTotal: 15000,
          numeroParcelas: 3,
          percentualEscritorio: 40,
          formaPagamentoPadrao: 'transferencia_direta',
        })
      );
      expect(result.success).toBe(true);
    });

    it('deve revalidar cache após criação', async () => {
      // Arrange
      const acordo = criarAcordoMock();
      const parcelas = [criarParcelaMock()];

      (service.criarAcordoComParcelas as jest.Mock).mockResolvedValue({
        ...acordo,
        parcelas,
      });

      // Act - must pass all required fields including formaDistribuicao for recebimento
      await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 1,
        dataVencimentoPrimeiraParcela: '2024-01-15',
        percentualEscritorio: 30,
        formaPagamentoPadrao: 'transferencia_direta',
        formaDistribuicao: 'dividido',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes');
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      (service.criarAcordoComParcelas as jest.Mock).mockRejectedValue(
        new Error('Erro ao criar acordo')
      );

      // Act
      const result = await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 1,
        dataVencimentoPrimeiraParcela: '2024-01-15',
        percentualEscritorio: 30,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionBuscarAcordosPorCPF', () => {
    it('deve buscar acordos por CPF', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const mockAcordos = [
        criarAcordoMock({ id: 1, processoId: 100 }),
        criarAcordoMock({ id: 2, processoId: 101 }),
      ];

      (service.buscarAcordosPorClienteCPF as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAcordos,
      });

      // Act - function takes (cpf, tipo?, status?) as separate args
      const result = await actionBuscarAcordosPorCPF(cpf);

      // Assert
      expect(service.buscarAcordosPorClienteCPF).toHaveBeenCalledWith(cpf, undefined, undefined);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAcordos);
      expect(result.data).toHaveLength(2);
    });

    it('deve retornar erro para CPF vazio', async () => {
      // Act
      const result = await actionBuscarAcordosPorCPF('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF invalido');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      (service.buscarAcordosPorClienteCPF as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'CPF deve conter 11 digitos', code: 'VALIDATION_ERROR' },
      });

      // Act
      const result = await actionBuscarAcordosPorCPF(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF deve conter 11 digitos');
    });
  });

  describe('actionBuscarAcordosPorNumeroProcesso', () => {
    it('deve buscar acordos por número de processo', async () => {
      // Arrange
      const numeroProcesso = '0001234-56.2023.5.02.0001';
      const mockAcordos = [criarAcordoMock({ processoId: 100 })];

      (service.buscarAcordosPorNumeroProcesso as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAcordos,
      });

      // Act - function takes (numeroProcesso, tipo?) as separate args
      const result = await actionBuscarAcordosPorNumeroProcesso(numeroProcesso);

      // Assert
      expect(service.buscarAcordosPorNumeroProcesso).toHaveBeenCalledWith(
        numeroProcesso,
        undefined
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAcordos);
    });

    it('deve retornar erro para número vazio', async () => {
      // Act
      const result = await actionBuscarAcordosPorNumeroProcesso('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Numero do processo invalido');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      // Arrange
      const numeroProcesso = '0001234-56.2023.5.02.0001';

      (service.buscarAcordosPorNumeroProcesso as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Processo nao encontrado', code: 'NOT_FOUND' },
      });

      // Act
      const result = await actionBuscarAcordosPorNumeroProcesso(numeroProcesso);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Processo nao encontrado');
    });
  });

  describe('actionListarAcordos', () => {
    it('deve listar acordos com paginação', async () => {
      // Arrange
      const mockResponse = {
        acordos: [
          criarAcordoMock({ id: 1 }),
          criarAcordoMock({ id: 2 }),
        ],
        total: 2,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };

      (service.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await actionListarAcordos({
        pagina: 1,
        limite: 10,
      });

      // Assert
      expect(service.listarAcordos).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('deve aplicar filtros de busca', async () => {
      // Arrange
      const mockResponse = {
        acordos: [criarAcordoMock()],
        total: 1,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };

      (service.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await actionListarAcordos({
        pagina: 1,
        limite: 10,
        tipo: 'acordo',
        status: 'pago_parcial',
        processoId: 100,
      });

      // Assert
      expect(service.listarAcordos).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
        tipo: 'acordo',
        status: 'pago_parcial',
        processoId: 100,
      });
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      (service.listarAcordos as jest.Mock).mockRejectedValue(
        new Error('Erro ao listar acordos')
      );

      // Act
      const result = await actionListarAcordos({ pagina: 1, limite: 10 });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
