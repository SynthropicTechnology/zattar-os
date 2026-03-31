import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock playwright before any imports that transitively pull it in
jest.mock('playwright', () => ({}));
jest.mock('playwright-core', () => ({}));

import * as service from '../../service';
import { criarProcessoMock, criarContratoMock, criarAudienciaMock, criarPagamentoMock } from '../fixtures';
import { ok, err, appError } from '@/types';
import * as partesService from '@/features/partes/service';
import * as acervoService from '@/features/acervo/service';
import * as contratosService from '@/features/contratos/service';
import * as audienciasService from '@/features/audiencias/service';
import * as obrigacoesService from '@/features/obrigacoes/service';

// Mock feature services
jest.mock('@/features/partes/service');
jest.mock('@/features/acervo/service');
jest.mock('@/features/contratos/service');
jest.mock('@/features/audiencias/service');
jest.mock('@/features/obrigacoes/service');

const mockPartesService = partesService as jest.Mocked<typeof partesService>;
const mockAcervoService = acervoService as jest.Mocked<typeof acervoService>;
const mockContratosService = contratosService as jest.Mocked<typeof contratosService>;
const mockAudienciasService = audienciasService as jest.Mocked<typeof audienciasService>;
const mockObrigacoesService = obrigacoesService as jest.Mocked<typeof obrigacoesService>;

describe('Portal Cliente Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obterDashboardCliente', () => {
    it('deve obter dashboard completo com sucesso', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cliente = { id: 100, nome: 'João da Silva', cpf: '12345678900' };
      const processos = [criarProcessoMock({ id: 1 }), criarProcessoMock({ id: 2 })];
      const contratos = [criarContratoMock()];
      const audiencias = [criarAudienciaMock()];
      const pagamentos = [criarPagamentoMock()];

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));
      mockAcervoService.buscarProcessosClientePorCpf.mockResolvedValue(
        ok({ processos })
      );
      mockContratosService.listarContratosPorClienteId.mockResolvedValue(contratos);
      mockAudienciasService.listarAudienciasPorBuscaCpf.mockResolvedValue(audiencias);
      mockObrigacoesService.listarAcordosPorBuscaCpf.mockResolvedValue(pagamentos);

      // Act
      const result = await service.obterDashboardCliente(cpf);

      // Assert
      expect(result.cliente.nome).toBe('João da Silva');
      expect(result.cliente.cpf).toBe('12345678900');
      expect(result.processos).toHaveLength(2);
      expect(result.contratos).toHaveLength(1);
      expect(result.audiencias).toHaveLength(1);
      expect(result.pagamentos).toHaveLength(1);
    });

    it('deve limpar CPF antes de buscar', async () => {
      // Arrange
      const cpfFormatado = '123.456.789-00';
      const cpfLimpo = '12345678900';
      const cliente = { id: 100, nome: 'João da Silva', cpf: cpfLimpo };

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));
      mockAcervoService.buscarProcessosClientePorCpf.mockResolvedValue(
        ok({ processos: [] })
      );
      mockContratosService.listarContratosPorClienteId.mockResolvedValue([]);
      mockAudienciasService.listarAudienciasPorBuscaCpf.mockResolvedValue([]);
      mockObrigacoesService.listarAcordosPorBuscaCpf.mockResolvedValue([]);

      // Act
      await service.obterDashboardCliente(cpfFormatado);

      // Assert
      expect(mockPartesService.buscarClientePorDocumento).toHaveBeenCalledWith(
        cpfLimpo
      );
    });

    it('deve lançar erro quando cliente não encontrado', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(null));

      // Act & Assert
      await expect(service.obterDashboardCliente(cpf)).rejects.toThrow(
        'Cliente não encontrado'
      );
    });

    it('deve lançar erro quando buscarClientePorDocumento falha', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao buscar cliente'))
      );

      // Act & Assert
      await expect(service.obterDashboardCliente(cpf)).rejects.toThrow(
        'Cliente não encontrado'
      );
    });

    it('deve retornar arrays vazios quando serviços falham', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cliente = { id: 100, nome: 'João da Silva', cpf: '12345678900' };

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));
      mockAcervoService.buscarProcessosClientePorCpf.mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro'))
      );
      mockContratosService.listarContratosPorClienteId.mockResolvedValue([]);
      mockAudienciasService.listarAudienciasPorBuscaCpf.mockResolvedValue([]);
      mockObrigacoesService.listarAcordosPorBuscaCpf.mockResolvedValue([]);

      // Act
      const result = await service.obterDashboardCliente(cpf);

      // Assert
      expect(result.processos).toHaveLength(0);
      expect(result.contratos).toHaveLength(0);
      expect(result.audiencias).toHaveLength(0);
      expect(result.pagamentos).toHaveLength(0);
    });

    it('deve fazer chamadas em paralelo para contratos, audiencias e pagamentos', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cliente = { id: 100, nome: 'João da Silva', cpf: '12345678900' };

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));
      mockAcervoService.buscarProcessosClientePorCpf.mockResolvedValue(
        ok({ processos: [] })
      );

      const contratosPromise = Promise.resolve([]);
      const audienciasPromise = Promise.resolve([]);
      const pagamentosPromise = Promise.resolve([]);

      mockContratosService.listarContratosPorClienteId.mockReturnValue(contratosPromise);
      mockAudienciasService.listarAudienciasPorBuscaCpf.mockReturnValue(
        audienciasPromise
      );
      mockObrigacoesService.listarAcordosPorBuscaCpf.mockReturnValue(pagamentosPromise);

      // Act
      await service.obterDashboardCliente(cpf);

      // Assert
      expect(mockContratosService.listarContratosPorClienteId).toHaveBeenCalledWith(100);
      expect(mockAudienciasService.listarAudienciasPorBuscaCpf).toHaveBeenCalledWith(
        '12345678900'
      );
      expect(mockObrigacoesService.listarAcordosPorBuscaCpf).toHaveBeenCalledWith(
        '12345678900'
      );
    });

    it('deve usar ID do cliente para buscar contratos', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cliente = { id: 999, nome: 'Maria Santos', cpf: '98765432100' };

      mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));
      mockAcervoService.buscarProcessosClientePorCpf.mockResolvedValue(
        ok({ processos: [] })
      );
      mockContratosService.listarContratosPorClienteId.mockResolvedValue([]);
      mockAudienciasService.listarAudienciasPorBuscaCpf.mockResolvedValue([]);
      mockObrigacoesService.listarAcordosPorBuscaCpf.mockResolvedValue([]);

      // Act
      await service.obterDashboardCliente(cpf);

      // Assert
      expect(mockContratosService.listarContratosPorClienteId).toHaveBeenCalledWith(999);
    });
  });
});
