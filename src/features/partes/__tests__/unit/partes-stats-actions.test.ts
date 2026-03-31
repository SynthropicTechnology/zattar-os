// using globals

import * as service from '../../service';

jest.mock('../../service');

// Importar depois dos mocks
import { actionContarPartesPorTipo } from '../../actions/partes-stats-actions';

// =============================================================================
// Helpers de mock
// =============================================================================

function mockSucesso<T>(valor: T) {
  return Promise.resolve({ success: true as const, data: valor });
}

function mockErro(msg = 'Erro simulado') {
  return Promise.resolve({ success: false as const, error: msg });
}

function configurarTodosSucesso(opcoes: {
  clientes?: number;
  clientesMes?: number;
  partes?: number;
  partesMes?: number;
  terceiros?: number;
  terceirosMes?: number;
  representantes?: number;
  representantesMes?: number;
} = {}) {
  const {
    clientes = 50,
    clientesMes = 5,
    partes = 30,
    partesMes = 3,
    terceiros = 20,
    terceirosMes = 2,
    representantes = 10,
    representantesMes = 1,
  } = opcoes;

  (service.contarClientes as jest.Mock).mockResolvedValue({ success: true, data: clientes });
  (service.contarClientesEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: clientesMes });
  (service.contarPartesContrarias as jest.Mock).mockResolvedValue({ success: true, data: partes });
  (service.contarPartesContrariasEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: partesMes });
  (service.contarTerceiros as jest.Mock).mockResolvedValue({ success: true, data: terceiros });
  (service.contarTerceirosEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: terceirosMes });
  (service.contarRepresentantes as jest.Mock).mockResolvedValue({ success: true, data: representantes });
  (service.contarRepresentantesEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: representantesMes });
}

// =============================================================================
// actionContarPartesPorTipo
// =============================================================================

describe('actionContarPartesPorTipo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('quando todos os serviços retornam sucesso', () => {
    it('deve retornar estrutura correta com os totais e novosMes', async () => {
      configurarTodosSucesso({
        clientes: 50,
        clientesMes: 5,
        partes: 30,
        partesMes: 3,
        terceiros: 20,
        terceirosMes: 2,
        representantes: 10,
        representantesMes: 1,
      });

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientes).toEqual({ total: 50, novosMes: 5 });
        expect(result.data.partesContrarias).toEqual({ total: 30, novosMes: 3 });
        expect(result.data.terceiros).toEqual({ total: 20, novosMes: 2 });
        expect(result.data.representantes).toEqual({ total: 10, novosMes: 1 });
      }
    });

    it('deve chamar todos os 8 serviços em paralelo', async () => {
      configurarTodosSucesso();

      await actionContarPartesPorTipo();

      expect(service.contarClientes).toHaveBeenCalledTimes(1);
      expect(service.contarClientesEntreDatas).toHaveBeenCalledTimes(1);
      expect(service.contarPartesContrarias).toHaveBeenCalledTimes(1);
      expect(service.contarPartesContrariasEntreDatas).toHaveBeenCalledTimes(1);
      expect(service.contarTerceiros).toHaveBeenCalledTimes(1);
      expect(service.contarTerceirosEntreDatas).toHaveBeenCalledTimes(1);
      expect(service.contarRepresentantes).toHaveBeenCalledTimes(1);
      expect(service.contarRepresentantesEntreDatas).toHaveBeenCalledTimes(1);
    });

    it('deve passar datas de início e fim do mês corrente para EntreDatas', async () => {
      configurarTodosSucesso();

      const antes = new Date();
      await actionContarPartesPorTipo();
      const depois = new Date();

      const chamada = (service.contarClientesEntreDatas as jest.Mock).mock.calls[0];
      const inicio = chamada[0] as Date;
      const fim = chamada[1] as Date;

      expect(inicio.getDate()).toBe(1);
      expect(inicio.getMonth()).toBe(antes.getMonth());
      expect(fim.getMonth()).toBe(antes.getMonth());
      expect(fim.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(fim.getTime()).toBeLessThanOrEqual(depois.getTime() + 1000);
    });

    it('deve retornar zeros quando todos os totais são 0', async () => {
      configurarTodosSucesso({
        clientes: 0,
        clientesMes: 0,
        partes: 0,
        partesMes: 0,
        terceiros: 0,
        terceirosMes: 0,
        representantes: 0,
        representantesMes: 0,
      });

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientes).toEqual({ total: 0, novosMes: 0 });
        expect(result.data.partesContrarias).toEqual({ total: 0, novosMes: 0 });
        expect(result.data.terceiros).toEqual({ total: 0, novosMes: 0 });
        expect(result.data.representantes).toEqual({ total: 0, novosMes: 0 });
      }
    });
  });

  describe('degradação graciosamente quando um serviço falha', () => {
    it('clientes total falha → usa 0 para clientes.total, outros intactos', async () => {
      (service.contarClientes as jest.Mock).mockResolvedValue({ success: false, error: 'DB error' });
      (service.contarClientesEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 5 });
      (service.contarPartesContrarias as jest.Mock).mockResolvedValue({ success: true, data: 30 });
      (service.contarPartesContrariasEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 3 });
      (service.contarTerceiros as jest.Mock).mockResolvedValue({ success: true, data: 20 });
      (service.contarTerceirosEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 2 });
      (service.contarRepresentantes as jest.Mock).mockResolvedValue({ success: true, data: 10 });
      (service.contarRepresentantesEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 1 });

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientes.total).toBe(0);
        expect(result.data.clientes.novosMes).toBe(5);
        expect(result.data.partesContrarias.total).toBe(30);
        expect(result.data.terceiros.total).toBe(20);
        expect(result.data.representantes.total).toBe(10);
      }
    });

    it('novosMes de partes falha → usa 0 para partesMes, outros intactos', async () => {
      configurarTodosSucesso();
      (service.contarPartesContrariasEntreDatas as jest.Mock).mockResolvedValue({
        success: false,
        error: 'timeout',
      });

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.partesContrarias.novosMes).toBe(0);
        expect(result.data.partesContrarias.total).toBe(30);
        expect(result.data.clientes.total).toBe(50);
      }
    });

    it('terceiros e representantes falham → usa 0 para ambos, clientes e partes intactos', async () => {
      (service.contarClientes as jest.Mock).mockResolvedValue({ success: true, data: 50 });
      (service.contarClientesEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 5 });
      (service.contarPartesContrarias as jest.Mock).mockResolvedValue({ success: true, data: 30 });
      (service.contarPartesContrariasEntreDatas as jest.Mock).mockResolvedValue({ success: true, data: 3 });
      (service.contarTerceiros as jest.Mock).mockResolvedValue({ success: false, error: 'falhou' });
      (service.contarTerceirosEntreDatas as jest.Mock).mockResolvedValue({ success: false, error: 'falhou' });
      (service.contarRepresentantes as jest.Mock).mockResolvedValue({ success: false, error: 'falhou' });
      (service.contarRepresentantesEntreDatas as jest.Mock).mockResolvedValue({ success: false, error: 'falhou' });

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientes.total).toBe(50);
        expect(result.data.partesContrarias.total).toBe(30);
        expect(result.data.terceiros).toEqual({ total: 0, novosMes: 0 });
        expect(result.data.representantes).toEqual({ total: 0, novosMes: 0 });
      }
    });
  });

  describe('quando todos os serviços lançam exceção', () => {
    it('Promise.all rejeitado → retorna { success: false, error: ... }', async () => {
      (service.contarClientes as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarClientesEntreDatas as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarPartesContrarias as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarPartesContrariasEntreDatas as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarTerceiros as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarTerceirosEntreDatas as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarRepresentantes as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));
      (service.contarRepresentantesEntreDatas as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao contar partes');
      }
    });

    it('um único serviço lança exceção → Promise.all rejeita, retorna erro', async () => {
      configurarTodosSucesso();
      (service.contarRepresentantes as jest.Mock).mockRejectedValue(new Error('Timeout DB'));

      const result = await actionContarPartesPorTipo();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
