import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarPericiaMock, criarEspecialidadeMock } from '../fixtures';
import { SituacaoPericiaCodigo } from '../../domain';
import { GrauTribunal } from '@/app/app/expedientes/domain';

// Mock Supabase
type MockSupabaseClient = {
  from: jest.Mock;
  select: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  or: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
};

const mockSupabaseClient = {} as MockSupabaseClient;
mockSupabaseClient.from = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.select = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.update = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.eq = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.is = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.or = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.gte = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.lt = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.order = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.range = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.limit = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.maybeSingle = jest.fn();

jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(() => mockSupabaseClient),
}));

describe('Perícias - Fluxos de Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo de Listagem e Filtros', () => {
    it('deve listar perícias → filtrar por responsável → atribuir novo responsável', async () => {
      // Arrange - Listar perícias
      const pericias = [
        criarPericiaMock({ id: 1, responsavelId: null }),
        criarPericiaMock({ id: 2, responsavelId: 5 }),
      ];

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: pericias,
        error: null,
        count: 2,
      });

      // Act - Listar
      const resultListar = await repository.findAllPericias({
        pagina: 1,
        limite: 50,
      });

      expect(resultListar.success).toBe(true);
      if (resultListar.success) {
        expect(resultListar.data.data).toHaveLength(2);
      }

      // Arrange - Filtrar por sem responsável
      mockSupabaseClient.is.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: [pericias[0]],
        error: null,
        count: 1,
      });

      // Act - Filtrar
      const resultFiltrar = await repository.findAllPericias({
        semResponsavel: true,
      });

      expect(resultFiltrar.success).toBe(true);
      if (resultFiltrar.success) {
        expect(resultFiltrar.data.data).toHaveLength(1);
      }

      // Arrange - Atribuir responsável
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: null,
      });

      // Act - Atribuir
      const resultAtribuir = await repository.atribuirResponsavelPericia(1, 10);

      expect(resultAtribuir.success).toBe(true);
    });
  });

  describe('Fluxo de Busca e Observação', () => {
    it('deve buscar perícia → adicionar observação → validar atualização', async () => {
      // Arrange - Buscar
      const pericia = criarPericiaMock({
        id: 1,
        observacoes: 'Observação inicial',
      });

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: pericia,
        error: null,
      });

      // Act - Buscar
      const resultBuscar = await repository.findPericiaById(1);

      expect(resultBuscar.success).toBe(true);
      if (resultBuscar.success) {
        expect(resultBuscar.data?.observacoes).toBe('Observação inicial');
      }

      // Arrange - Adicionar observação
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: null,
      });

      // Act - Adicionar observação
      const resultObservacao = await repository.adicionarObservacaoPericia(
        1,
        'Nova observação importante'
      );

      expect(resultObservacao.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          observacoes: 'Nova observação importante',
        })
      );
    });
  });

  describe('Fluxo de Especialidades e Filtros', () => {
    it('deve listar especialidades → filtrar perícias por especialidade', async () => {
      // Arrange - Listar especialidades
      const especialidades = [
        criarEspecialidadeMock({ id: 1, descricao: 'Medicina do Trabalho' }),
        criarEspecialidadeMock({ id: 2, descricao: 'Engenharia de Segurança' }),
      ];

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: especialidades,
        error: null,
      });

      // Act - Listar especialidades
      const resultEspecialidades = await repository.listEspecialidadesPericia();

      expect(resultEspecialidades.success).toBe(true);
      if (resultEspecialidades.success) {
        expect(resultEspecialidades.data).toHaveLength(2);
      }

      // Arrange - Filtrar por especialidade
      const pericias = [
        criarPericiaMock({ id: 1, especialidadeId: 1 }),
      ];

      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: pericias,
        error: null,
        count: 1,
      });

      // Act - Filtrar
      const resultFiltrar = await repository.findAllPericias({
        especialidadeId: 1,
      });

      expect(resultFiltrar.success).toBe(true);
      if (resultFiltrar.success) {
        expect(resultFiltrar.data.data).toHaveLength(1);
      }
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('especialidade_id', 1);
    });
  });

  describe('Fluxo de Filtros de Data', () => {
    it('deve filtrar por prazo de entrega (range de datas) → validar cálculo de próximo dia', async () => {
      // Arrange
      const pericias = [
        criarPericiaMock({
          id: 1,
          prazoEntrega: '2024-06-15',
        }),
        criarPericiaMock({
          id: 2,
          prazoEntrega: '2024-12-20',
        }),
      ];

      mockSupabaseClient.gte.mockReturnThis();
      mockSupabaseClient.lt.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: pericias,
        error: null,
        count: 2,
      });

      // Act
      const result = await repository.findAllPericias({
        prazoEntregaInicio: '2024-01-01',
        prazoEntregaFim: '2024-12-31',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('prazo_entrega', '2024-01-01');
      // Verifica se foi calculado próximo dia (2025-01-01)
      expect(mockSupabaseClient.lt).toHaveBeenCalledWith('prazo_entrega', '2025-01-01');
    });

    it('deve filtrar por data de criação', async () => {
      // Arrange
      mockSupabaseClient.gte.mockReturnThis();
      mockSupabaseClient.lt.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        dataCriacaoInicio: '2024-01-01',
        dataCriacaoFim: '2024-06-30',
      });

      // Assert
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('data_criacao', '2024-01-01');
      expect(mockSupabaseClient.lt).toHaveBeenCalledWith('data_criacao', '2024-07-01');
    });
  });

  describe('Fluxo de Filtros Complexos', () => {
    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      // Arrange
      const pericias = [
        criarPericiaMock({
          id: 1,
          trt: 'TRT2',
          grau: GrauTribunal.PRIMEIRO_GRAU,
          situacaoCodigo: SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
          responsavelId: 5,
          laudoJuntado: false,
          segredoJustica: false,
        }),
      ];

      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: pericias,
        error: null,
        count: 1,
      });

      // Act
      const result = await repository.findAllPericias({
        trt: 'TRT2',
        grau: GrauTribunal.PRIMEIRO_GRAU,
        situacaoCodigo: SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
        responsavelId: 5,
        laudoJuntado: false,
        segredoJustica: false,
        arquivado: false,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('trt', 'TRT2');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('grau', GrauTribunal.PRIMEIRO_GRAU);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('situacao_codigo', 'L');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('responsavel_id', 5);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('laudo_juntado', false);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('segredo_justica', false);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('arquivado', false);
    });
  });

  describe('Fluxo de Joins Complexos', () => {
    it('deve buscar perícia com todos os joins (especialidade, perito, responsavel, processo)', async () => {
      // Arrange
      const pericia = {
        ...criarPericiaMock({
          id: 1,
          especialidade: undefined,
          perito: undefined,
          responsavel: undefined,
          processo: undefined,
        }),
        especialidade: { descricao: 'Medicina do Trabalho' },
        perito: { nome: 'Dr. João Silva' },
        responsavel: { nome_exibicao: 'Maria Santos' },
        processo: {
          numero_processo: '0001234-56.2023.5.02.0001',
          nome_parte_autora: 'João da Silva',
          nome_parte_re: 'Empresa XPTO Ltda',
        },
      };

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: pericia,
        error: null,
      });

      // Act
      const result = await repository.findPericiaById(1);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.especialidade?.descricao).toBe('Medicina do Trabalho');
        expect(result.data?.perito?.nome).toBe('Dr. João Silva');
        expect(result.data?.responsavel?.nomeExibicao).toBe('Maria Santos');
        expect(result.data?.processo?.nomeParteAutora).toBe('João da Silva');
      }
      // Verificar que o select incluiu os joins
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('especialidade:especialidades_pericia')
      );
    });
  });
});
