import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { criarDashboardDataMock } from '../fixtures';
import type { DashboardData } from '../../types';
import type { Result } from '@/types/result';

// Types for mocks
type Cliente = { id: number; nome: string; documento: string; cpf?: string };
type ValidationResult = { valido: boolean; cpfLimpo: string; erro?: string };
type CookieValue = { name: string; value: string } | null | undefined;

// Mock dependencies
const mockCookies = {
  get: jest.fn<() => CookieValue>(),
  set: jest.fn<(name: string, value: string, options?: Record<string, unknown>) => void>(),
  delete: jest.fn<(name: string) => void>(),
};

// Redirect should throw to simulate Next.js behavior
const mockRedirect = jest.fn<(url: string) => never>().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT: ${url}`);
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock service with proper named exports
const mockObterDashboardCliente = jest.fn<(cpf: string) => Promise<DashboardData>>();
jest.mock('../../service', () => ({
  obterDashboardCliente: mockObterDashboardCliente,
}));

// Mock utils with proper named exports
const mockValidarCpf = jest.fn<(cpf: string) => ValidationResult>();
jest.mock('../../utils', () => ({
  validarCpf: mockValidarCpf,
}));

// Mock buscarClientePorDocumento from partes service
const mockBuscarClientePorDocumento = jest.fn<(documento: string) => Promise<Result<Cliente | null>>>();
jest.mock('@/app/app/partes/server', () => ({
  buscarClientePorDocumento: mockBuscarClientePorDocumento,
}));

// Import REAL actions (after mocks)
import {
  actionLoginPortal,
  actionCarregarDashboard,
  actionLogout,
  validarCpfESetarSessao,
} from '../../actions/portal-actions';

describe('Portal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validarCpfESetarSessao', () => {
    it('deve validar CPF válido e setar sessão com JSON {cpf, nome}', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfLimpo = '12345678900';
      const nomeCliente = 'João da Silva';

      mockValidarCpf.mockReturnValue({
        valido: true,
        cpfLimpo,
      });

      mockBuscarClientePorDocumento.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          nome: nomeCliente,
          documento: cpfLimpo,
        },
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(true);
      expect(mockValidarCpf).toHaveBeenCalledWith(cpf);
      expect(mockBuscarClientePorDocumento).toHaveBeenCalledWith(cpfLimpo);

      // Verify cookie is set with JSON format {cpf, nome}
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.stringMatching(/^\{"cpf":"12345678900","nome":"[^"]+"\}$/),
        expect.objectContaining({
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
        })
      );

      // Verify cookie value can be parsed as JSON
      const cookieValue = mockCookies.set.mock.calls[0][1] as string;
      const parsed = JSON.parse(cookieValue);
      expect(parsed).toEqual({
        cpf: cpfLimpo,
        nome: nomeCliente,
      });
    });

    it('deve retornar erro para CPF inválido', async () => {
      // Arrange
      const cpf = '11111111111';

      mockValidarCpf.mockReturnValue({
        valido: false,
        cpfLimpo: '11111111111',
        erro: 'CPF inválido',
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF inválido. Verifique os números digitados.');
      expect(mockCookies.set).not.toHaveBeenCalled();
      expect(mockBuscarClientePorDocumento).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando cliente não encontrado', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      mockValidarCpf.mockReturnValue({
        valido: true,
        cpfLimpo: '12345678900',
      });

      mockBuscarClientePorDocumento.mockResolvedValue({
        success: true,
        data: null,
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF não cadastrado no sistema. Entre em contato com o escritório.');
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('actionLoginPortal', () => {
    it('deve fazer login com sucesso, setar cookie JSON e redirecionar', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfLimpo = '12345678900';
      const nomeCliente = 'João da Silva';

      mockValidarCpf.mockReturnValue({
        valido: true,
        cpfLimpo,
      });

      mockBuscarClientePorDocumento.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          nome: nomeCliente,
          documento: cpfLimpo,
        },
      });

      // Act - redirect will throw in tests, catch it
      await expect(actionLoginPortal(cpf)).rejects.toThrow();

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.stringMatching(/^\{"cpf":"12345678900","nome":"[^"]+"\}$/),
        expect.objectContaining({
          httpOnly: true,
        })
      );
      expect(mockRedirect).toHaveBeenCalledWith('/portal/processos');
    });

    it('deve retornar erro ao invés de redirecionar quando falha', async () => {
      // Arrange
      const cpf = '11111111111';

      mockValidarCpf.mockReturnValue({
        valido: false,
        cpfLimpo: '11111111111',
        erro: 'CPF inválido',
      });

      // Act
      const result = await actionLoginPortal(cpf);

      // Assert
      expect(result).toBeDefined();
      if (result) {
        expect(result.success).toBe(false);
        expect(result.error).toBe('CPF inválido. Verifique os números digitados.');
      }
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('actionCarregarDashboard', () => {
    it('deve carregar dashboard quando sessão válida com JSON cookie', async () => {
      // Arrange
      const cpfLimpo = '12345678900';
      const nomeCliente = 'João da Silva';
      const dashboardData = criarDashboardDataMock();

      // Mock cookie with JSON format {cpf, nome}
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: JSON.stringify({ cpf: cpfLimpo, nome: nomeCliente }),
      });

      mockObterDashboardCliente.mockResolvedValue(dashboardData);

      // Act
      const result = await actionCarregarDashboard();

      // Assert
      expect(result).toEqual(dashboardData);
      expect(mockObterDashboardCliente).toHaveBeenCalledWith(cpfLimpo);
    });

    it('deve lançar erro quando sessão inválida', async () => {
      // Arrange
      mockCookies.get.mockReturnValue(null);

      // Act & Assert
      await expect(actionCarregarDashboard()).rejects.toThrow('Sessão inválida');
      expect(mockObterDashboardCliente).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando JSON do cookie está malformado', async () => {
      // Arrange - invalid JSON
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: 'invalid-json-string',
      });

      // Act & Assert
      await expect(actionCarregarDashboard()).rejects.toThrow();
      expect(mockObterDashboardCliente).not.toHaveBeenCalled();
    });

    it('deve extrair CPF corretamente do JSON cookie', async () => {
      // Arrange
      const cpfLimpo = '98765432100';
      const nomeCliente = 'Maria Santos';
      const dashboardData = criarDashboardDataMock();

      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: JSON.stringify({ cpf: cpfLimpo, nome: nomeCliente }),
      });

      mockObterDashboardCliente.mockResolvedValue(dashboardData);

      // Act
      await actionCarregarDashboard();

      // Assert - verify CPF extracted from JSON, not the whole cookie value
      expect(mockObterDashboardCliente).toHaveBeenCalledWith(cpfLimpo);
    });
  });

  describe('actionLogout', () => {
    it('deve deletar ambos cookies e redirecionar', async () => {
      // Act - redirect will throw in tests, catch it
      await expect(actionLogout()).rejects.toThrow();

      // Assert - verify both cookies are deleted
      expect(mockCookies.delete).toHaveBeenCalledWith('portal-cpf-session');
      expect(mockCookies.delete).toHaveBeenCalledWith('portal_session');
      expect(mockRedirect).toHaveBeenCalledWith('/portal');
    });
  });
});
