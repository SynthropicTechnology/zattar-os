import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import { criarClienteMock } from '../fixtures';

// Mock das dependências
jest.mock('../../service');
jest.mock('next/cache');
jest.mock('@/lib/safe-action', () => {
  const createWrapper = () => jest.fn((schema: any, handler: any) => {
    return async (input: unknown) => {
      const validation = schema.safeParse(input);
      if (!validation.success) {
        return {
          success: false,
          error: 'Erro de validação',
          message: validation.error.errors[0].message,
        };
      }
      try {
        const result = await handler(validation.data, { user: { id: 1, nomeCompleto: 'Test User' } });
        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    };
  });
  return {
    authenticatedAction: createWrapper(),
    authenticatedFormAction: createWrapper(),
  };
});

// Importar após os mocks estarem configurados
import {
  actionListarClientesSafe,
  actionBuscarClienteSafe,
  actionCriarClienteSafe,
  actionAtualizarClienteSafe,
  actionDesativarClienteSafe,
  actionListarClientes,
  actionBuscarCliente,
  actionBuscarClientePorCPF,
  actionBuscarClientePorCNPJ,
  actionContarClientes,
  actionContarClientesComEstatisticas,
  actionContarClientesPorEstado,
  actionListarClientesSugestoesSafe,
} from '../../actions/clientes-actions';

describe('Safe Actions - Novo Padrão', () => {
  const mockCliente = criarClienteMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarClientesSafe', () => {
    it('deve validar schema e listar clientes', async () => {
      const mockResultado = {
        data: [mockCliente],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      };
      (service.listarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResultado,
      });

      const result = await actionListarClientesSafe({
        pagina: 1,
        limite: 10,
        busca: 'teste',
      });

      expect(service.listarClientes).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
        busca: 'teste',
      });
      expect(result).toEqual({
        success: true,
        data: mockResultado,
      });
    });

    it('deve validar parâmetros obrigatórios', async () => {
      const result = await actionListarClientesSafe({
        pagina: 0,
        limite: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionBuscarClienteSafe', () => {
    it('deve validar ID obrigatório e buscar cliente', async () => {
      (service.buscarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCliente,
      });

      const result = await actionBuscarClienteSafe({ id: 1 });

      expect(service.buscarCliente).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        data: mockCliente,
      });
    });

    it('deve lançar erro se cliente não encontrado', async () => {
      (service.buscarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await actionBuscarClienteSafe({ id: 999 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nao encontrado');
    });
  });

  describe('actionCriarClienteSafe', () => {
    it('deve validar schema Zod e criar cliente', async () => {
      const novoCliente = {
        nome: 'Novo Cliente',
        tipo_pessoa: 'pf' as const,
        cpf: '12345678900',
        emails: ['novo@example.com'],
      };
      (service.criarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCliente,
      });

      const result = await actionCriarClienteSafe(novoCliente);

      expect(service.criarCliente).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/app/partes/clientes');
      expect(revalidatePath).toHaveBeenCalledWith('/app/partes');
      expect(result.success).toBe(true);
    });

    it('deve validar campos obrigatórios', async () => {
      const result = await actionCriarClienteSafe({
        nome: '',
        tipo_pessoa: 'pf' as const,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionAtualizarClienteSafe', () => {
    it('deve validar ID e dados, e atualizar cliente', async () => {
      const dadosAtualizacao = {
        id: 1,
        data: {
          nome: 'Cliente Atualizado',
          emails: ['atualizado@example.com'],
        },
      };
      (service.atualizarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCliente,
      });

      const result = await actionAtualizarClienteSafe(dadosAtualizacao);

      expect(service.atualizarCliente).toHaveBeenCalledWith(1, {
        nome: 'Cliente Atualizado',
        emails: ['atualizado@example.com'],
      });
      expect(revalidatePath).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('actionDesativarClienteSafe', () => {
    it('deve validar ID e desativar cliente', async () => {
      (service.desativarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await actionDesativarClienteSafe({ id: 1 });

      expect(service.desativarCliente).toHaveBeenCalledWith(1);
      expect(revalidatePath).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});

describe('Legacy Actions', () => {
  const mockCliente = criarClienteMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarClientes', () => {
    it('deve listar clientes com try-catch', async () => {
      const mockResultado = {
        data: [mockCliente],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      };
      (service.listarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResultado,
      });

      const result = await actionListarClientes({
        pagina: 1,
        limite: 10,
      });

      expect(result).toEqual({
        success: true,
        data: mockResultado,
      });
    });

    it('deve retornar erro em caso de falha', async () => {
      (service.listarClientes as jest.Mock).mockRejectedValue(
        new Error('Erro ao listar')
      );

      const result = await actionListarClientes({
        pagina: 1,
        limite: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionBuscarCliente', () => {
    it('deve validar ID e buscar cliente', async () => {
      (service.buscarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCliente,
      });

      const result = await actionBuscarCliente(1);

      expect(service.buscarCliente).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        data: mockCliente,
      });
    });

    it('deve retornar erro se cliente não encontrado', async () => {
      (service.buscarCliente as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await actionBuscarCliente(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('nao encontrado');
    });
  });

  describe('actionBuscarClientePorCPF', () => {
    it('deve validar CPF e buscar cliente', async () => {
      const mockClienteCompleto = {
        ...mockCliente,
        endereco: { rua: 'Rua Teste' },
        processos: [],
      };
      (service.buscarClientePorCPF as jest.Mock).mockResolvedValue({
        success: true,
        data: mockClienteCompleto,
      });

      const result = await actionBuscarClientePorCPF('12345678900');

      expect(service.buscarClientePorCPF).toHaveBeenCalledWith('12345678900');
      expect(result).toEqual({
        success: true,
        data: mockClienteCompleto,
      });
    });

    it('deve retornar erro para CPF inválido', async () => {
      // buscarClientePorCPF validates CPF and returns error Result
      (service.buscarClientePorCPF as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'CPF e obrigatorio' },
      });

      const result = await actionBuscarClientePorCPF('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('CPF');
    });
  });

  describe('actionBuscarClientePorCNPJ', () => {
    it('deve validar CNPJ e buscar cliente', async () => {
      const mockClientePJ = criarClienteMock({
        tipo_pessoa: 'pj',
        cnpj: '12345678000190',
        cpf: null,
      });
      (service.buscarClientePorCNPJ as jest.Mock).mockResolvedValue({
        success: true,
        data: mockClientePJ,
      });

      const result = await actionBuscarClientePorCNPJ('12345678000190');

      expect(service.buscarClientePorCNPJ).toHaveBeenCalledWith('12345678000190');
      expect(result).toEqual({
        success: true,
        data: mockClientePJ,
      });
    });

    it('deve retornar erro para CNPJ inválido', async () => {
      (service.buscarClientePorCNPJ as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'CNPJ e obrigatorio' },
      });

      const result = await actionBuscarClientePorCNPJ('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('CNPJ');
    });
  });
});

describe('Dashboard - Estatísticas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionContarClientes', () => {
    it('deve chamar service e retornar total', async () => {
      (service.contarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: 42,
      });

      const result = await actionContarClientes();

      expect(service.contarClientes).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: 42,
      });
    });

    it('deve tratar erros', async () => {
      (service.contarClientes as jest.Mock).mockRejectedValue(
        new Error('Erro ao contar')
      );

      const result = await actionContarClientes();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionListarClientesSugestoesSafe', () => {
    it('deve validar schema e retornar opções formatadas', async () => {
      const mockClientes = [
        criarClienteMock({ id: 1, nome: 'Cliente PF', tipo_pessoa: 'pf', cpf: '12345678900' }),
        criarClienteMock({ id: 2, nome: 'Cliente PJ', tipo_pessoa: 'pj', cnpj: '12345678000190', cpf: null }),
      ];

      (service.listarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          data: mockClientes,
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasMore: false },
        },
      });

      const result = await actionListarClientesSugestoesSafe({ limit: 20 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toHaveLength(2);
        expect(result.data.options[0]).toMatchObject({
          id: 1,
          label: 'Cliente PF',
          cpf: '12345678900',
        });
        expect(result.data.options[1]).toMatchObject({
          id: 2,
          label: 'Cliente PJ',
          cnpj: '12345678000190',
        });
      }
    });

    it('deve limitar opções entre 1 e 100', async () => {
      (service.listarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasMore: false } },
      });

      await actionListarClientesSugestoesSafe({ limit: 100 });

      expect(service.listarClientes).toHaveBeenCalledWith({
        pagina: 1,
        limite: 100, // Should cap at 100
      });
    });
  });

  describe('actionContarClientesComEstatisticas', () => {
    it('deve retornar total sem variação para modo "all"', async () => {
      (service.contarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: 150,
      });

      const result = await actionContarClientesComEstatisticas({ mode: 'all' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(150);
        expect(result.data.variacaoPercentual).toBeNull();
        expect(result.data.comparacaoLabel).toBe('');
      }
    });

    it('deve calcular variação percentual para modo "range"', async () => {
      (service.contarClientesEntreDatas as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: 120 }) // Período atual
        .mockResolvedValueOnce({ success: true, data: 100 }); // Período anterior

      const result = await actionContarClientesComEstatisticas({
        mode: 'range',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(120);
        expect(result.data.variacaoPercentual).toBe(20); // (120-100)/100 * 100 = 20%
        expect(result.data.comparacaoLabel).toBe('em relação ao período anterior');
      }
    });

    it('deve calcular 100% de crescimento quando período anterior é zero', async () => {
      (service.contarClientesEntreDatas as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: 50 })
        .mockResolvedValueOnce({ success: true, data: 0 });

      const result = await actionContarClientesComEstatisticas({
        mode: 'range',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variacaoPercentual).toBe(100);
      }
    });

    it('deve retornar total padrão (comparação com mês anterior)', async () => {
      (service.contarClientes as jest.Mock).mockResolvedValue({
        success: true,
        data: 200,
      });
      (service.contarClientesAteData as jest.Mock).mockResolvedValue({
        success: true,
        data: 180,
      });

      const result = await actionContarClientesComEstatisticas();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(200);
        expect(result.data.variacaoPercentual).toBeCloseTo(11.11, 1); // (200-180)/180 * 100
      }
    });

    it('deve validar período inválido no modo range', async () => {
      const result = await actionContarClientesComEstatisticas({
        mode: 'range',
        from: 'invalid-date',
        to: '2024-01-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Período inválido');
    });
  });

  describe('actionContarClientesPorEstado', () => {
    it('deve contar clientes agrupados por estado', async () => {
      const mockEstados = [
        { estado: 'SP', total: 50 },
        { estado: 'RJ', total: 30 },
        { estado: 'MG', total: 20 },
      ];

      (service.contarClientesPorEstado as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEstados,
      });

      const result = await actionContarClientesPorEstado(4);

      expect(service.contarClientesPorEstado).toHaveBeenCalledWith(4);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockEstados);
      }
    });

    it('deve aplicar filtro de data quando modo "range" é fornecido', async () => {
      const mockEstados = [
        { estado: 'SP', total: 25 },
        { estado: 'RJ', total: 15 },
      ];

      (service.contarClientesPorEstadoComFiltro as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEstados,
      });

      const result = await actionContarClientesPorEstado(4, {
        mode: 'range',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(service.contarClientesPorEstadoComFiltro).toHaveBeenCalled();
      const call = (service.contarClientesPorEstadoComFiltro as jest.Mock).mock.calls[0][0];
      expect(call.limite).toBe(4);
      expect(call.dataInicio).toBeInstanceOf(Date);
      expect(call.dataFim).toBeInstanceOf(Date);
      expect(result.success).toBe(true);
    });

    it('deve retornar erro para período inválido', async () => {
      const result = await actionContarClientesPorEstado(4, {
        mode: 'range',
        from: 'invalid',
        to: '2024-01-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Período inválido');
    });
  });
});
