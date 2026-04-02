import { createDbClient } from '@/lib/supabase';
import {
  findProcessoById,
  findProcessoUnificadoById,
  findAllProcessos,
  findTimelineByProcessoId,
  saveProcesso,
  updateProcesso,
  advogadoExists,
  usuarioExists,
  findAllTribunais,
} from '../../repository';
import {
  criarProcessoMock,
  criarProcessoDbMock,
  criarTimelineMock,
} from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../helpers';
import { StatusProcesso } from '../../domain';

jest.mock('@/lib/supabase');
jest.mock('@/lib/redis/cache-utils', () => ({
  withCache: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  generateCacheKey: jest.fn().mockReturnValue('test-cache-key'),
  CACHE_PREFIXES: { acervo: 'acervo' },
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
  deleteCached: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/redis/invalidation', () => ({
  invalidateAcervoCache: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/supabase/query-logger', () => ({
  logQuery: jest.fn((_name: string, fn: () => Promise<unknown>) => fn()),
}));

interface MockSupabaseClient {
  from: jest.Mock;
}

interface MockQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
}

describe('Processos Repository', () => {
  let mockSupabaseClient: MockSupabaseClient;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findProcessoById', () => {
    it('deve buscar processo por ID e converter para camelCase', async () => {
      const dbData = criarProcessoDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acervo');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('numeroProcesso');
        expect(result.data).toHaveProperty('nomeParteAutora');
        expect(result.data.id).toBe(1);
      }
    });

    it('deve retornar null para processo inexistente (código PGRST116)', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findProcessoById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('deve retornar erro para falhas de banco', async () => {
      const error = mockPostgresError('42P01', 'Table does not exist');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findProcessoById(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('findProcessoUnificadoById', () => {
    it('deve buscar da view acervo_unificado', async () => {
      const dbData = {
        id: 1,
        numero_processo: '0001234-56.2023.5.15.0001',
        numero: 1234,
        advogado_id: 1,
        origem: 'acervo_geral',
        instances: [
          {
            grau: '1',
            trt: 'TRT15',
            status: 'ativo',
            descricao_orgao_julgador: '1ª Vara do Trabalho',
          },
        ],
        trt_origem: 'TRT15',
        grau_origem: '1',
        classe_judicial_origem: 'Reclamação Trabalhista',
        descricao_orgao_julgador_origem: '1ª Vara do Trabalho',
        nome_parte_autora_origem: 'João Silva',
        qtde_parte_autora_origem: 1,
        nome_parte_re_origem: 'Empresa XYZ',
        qtde_parte_re_origem: 1,
        data_autuacao_origem: '2023-01-15',
        segredo_justica: false,
        codigo_status_processo: '100',
        status: 'ativo',
        prioridade_processual: 0,
        juizo_digital: true,
        data_arquivamento: null,
        data_proxima_audiencia: null,
        tem_associacao: false,
        responsavel_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoUnificadoById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acervo_unificado');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('instances');
        expect(result.data).toHaveProperty('trtOrigem', 'TRT15');
        expect(result.data).toHaveProperty('nomeParteAutoraOrigem', 'João Silva');
      }
    });

    it('deve mapear instances (graus ativos)', async () => {
      const dbData = {
        id: 1,
        numero_processo: '0001234-56.2023.5.15.0001',
        instances: [
          { grau: '1', trt: 'TRT15', status: 'ativo' },
          { grau: '2', trt: 'TRT15', status: 'ativo' },
        ],
        trt_origem: 'TRT15',
        grau_origem: '1',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoUnificadoById(1);

      if (result.success && result.data) {
        expect(result.data.instances).toHaveLength(2);
        expect(result.data.instances[0]).toHaveProperty('grau', '1');
        expect(result.data.instances[1]).toHaveProperty('grau', '2');
      }
    });

    it('deve usar fallback para campos ausentes', async () => {
      const dbData = {
        id: 1,
        numero_processo: '0001234-56.2023.5.15.0001',
        trt_origem: null,
        grau_origem: null,
        nome_parte_autora_origem: null,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoUnificadoById(1);

      if (result.success && result.data) {
        expect(result.data.trtOrigem).toBeUndefined();
        expect(result.data.grauOrigem).toBeUndefined();
      }
    });
  });

  describe('findAllProcessos', () => {
    it('deve aplicar filtros indexados primeiro', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({
        advogadoId: 1,
        origem: 'acervo_geral',
        trt: 'TRT15',
        grau: '1',
        responsavelId: 10,
      });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('advogado_id', 1);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('origem', 'acervo_geral');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('responsavel_id', 10);
    });

    it('deve aplicar filtros de texto com ilike', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({
        nomeParteAutora: 'João',
        nomeParteRe: 'Empresa',
        descricaoOrgaoJulgador: 'Vara',
        classeJudicial: 'Reclamação',
      });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome_parte_autora', '%João%');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome_parte_re', '%Empresa%');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('descricao_orgao_julgador', '%Vara%');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('classe_judicial', '%Reclamação%');
    });

    it('deve aplicar filtros booleanos', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({
        segredoJustica: true,
        juizoDigital: false,
        temAssociacao: true,
        temProximaAudiencia: true,
        semResponsavel: true,
      });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('segredo_justica', true);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('juizo_digital', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tem_associacao', true);
      expect(mockQueryBuilder.not).toHaveBeenCalledWith('data_proxima_audiencia', 'is', null);
      expect(mockQueryBuilder.is).toHaveBeenCalledWith('responsavel_id', null);
    });

    it('deve aplicar filtros de data (ranges)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({
        dataAutuacaoInicio: '2023-01-01',
        dataAutuacaoFim: '2023-12-31',
        dataArquivamentoInicio: '2023-06-01',
        dataArquivamentoFim: '2023-06-30',
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('data_autuacao', '2023-01-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('data_autuacao', '2023-12-31');
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('data_arquivamento', '2023-06-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('data_arquivamento', '2023-06-30');
    });

    it('deve aplicar filtro de relacionamento clienteId', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({ clienteId: 5 });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acervo_unificado');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('deve aplicar busca geral com or() em múltiplos campos', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({ busca: 'João Silva' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({
        ordenarPor: 'dataAutuacao',
        ordem: 'desc',
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('data_autuacao', {
        ascending: false,
        nullsFirst: false,
      });
    });

    it('deve paginar corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await findAllProcessos({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar lista vazia para clienteId sem processos vinculados', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      const result = await findAllProcessos({ clienteId: 999 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      }
    });

    it('deve mapear ProcessoUnificado com instances', async () => {
      const dbData = [
        {
          id: 1,
          numero_processo: '0001234-56.2023.5.15.0001',
          instances: [{ grau: '1', trt: 'TRT15', status: 'ativo' }],
          trt_origem: 'TRT15',
          grau_origem: '1',
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllProcessos({});

      if (result.success && result.data) {
        expect(result.data[0]).toHaveProperty('instances');
        expect(result.data[0]).toHaveProperty('trtOrigem');
      }
    });

    it('deve lidar com trt como array', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({ trt: ['TRT15', 'TRT02'] });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('trt', ['TRT15', 'TRT02']);
    });

    it('deve lidar com trt como string', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllProcessos({ trt: 'TRT15' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('trt', 'TRT15');
    });

    it('deve lidar com paginação em página vazia', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 5 });

      const result = await findAllProcessos({ pagina: 10, limite: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('findTimelineByProcessoId', () => {
    it('deve buscar timeline do campo timeline_jsonb', async () => {
      const timeline = criarTimelineMock();

      // Mock findProcessoById to return a valid processo
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: criarProcessoDbMock({ id: 1, id_pje: 100, trt: 'TRT15', grau: '1' }),
        error: null,
      });

      // Mock acervo query for timeline
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { timeline_jsonb: timeline },
        error: null,
      });

      const result = await findTimelineByProcessoId(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acervo');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('timeline_jsonb');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id_pje', 100);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('trt', 'TRT15');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('grau', '1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve mapear movimentações com tipoMovimentacao', async () => {
      const timeline = criarTimelineMock();

      // Mock findProcessoById
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: criarProcessoDbMock({ id: 1, id_pje: 100, trt: 'TRT15', grau: '1' }),
        error: null,
      });

      // Mock acervo query
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { timeline_jsonb: timeline },
        error: null,
      });

      const result = await findTimelineByProcessoId(1);

      if (result.success && result.data) {
        expect(result.data[0]).toHaveProperty('tipoMovimentacao', 'documento');
        expect(result.data[1]).toHaveProperty('tipoMovimentacao', 'movimento');
      }
    });

    it('deve retornar array vazio se não houver timeline', async () => {
      // Mock findProcessoById
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: criarProcessoDbMock({ id: 1, id_pje: 100, trt: 'TRT15', grau: '1' }),
        error: null,
      });

      // Mock acervo query
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { timeline_jsonb: null },
        error: null,
      });

      const result = await findTimelineByProcessoId(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('deve usar metadata.capturadoEm como createdAt', async () => {
      const timeline = criarTimelineMock();

      // Mock findProcessoById
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: criarProcessoDbMock({ id: 1, id_pje: 100, trt: 'TRT15', grau: '1' }),
        error: null,
      });

      // Mock acervo query
      mockSupabaseClient.from.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { timeline_jsonb: timeline },
        error: null,
      });

      const result = await findTimelineByProcessoId(1);

      if (result.success && result.data) {
        expect(result.data[0]).toHaveProperty('createdAt');
      }
    });
  });

  describe('advogadoExists', () => {
    it('deve retornar true se advogado existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: { id: 1 },
        error: null,
      });

      const result = await advogadoExists(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('advogados');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('deve retornar false se não existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await advogadoExists(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('usuarioExists', () => {
    it('deve retornar true se usuário existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: { id: 1 },
        error: null,
      });

      const result = await usuarioExists(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usuarios');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('deve retornar false se não existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await usuarioExists(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('findAllTribunais', () => {
    it('deve listar tribunais ativos ordenados por código', async () => {
      const tribunais = [
        { codigo: 'TRT01', nome: 'TRT 1ª Região' },
        { codigo: 'TRT02', nome: 'TRT 2ª Região' },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: tribunais, error: null });

      const result = await findAllTribunais();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tribunais');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('ativo', true);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('codigo');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve retornar lista vazia se tabela não existe (código 42P01)', async () => {
      const error = mockPostgresError('42P01', 'Table does not exist');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: null, error });

      const result = await findAllTribunais();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('saveProcesso', () => {
    it('deve inserir processo com mapeamento camelCase → snake_case', async () => {
      const processo = criarProcessoMock();
      const dbData = criarProcessoDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveProcesso(processo);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acervo');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve aplicar valores padrão', async () => {
      const processo = criarProcessoMock({
        segredoJustica: undefined as unknown as boolean,
        juizoDigital: undefined as unknown as boolean,
        prioridadeProcessual: undefined as unknown as number,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoDbMock(),
        error: null,
      });

      await saveProcesso(processo);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('segredo_justica', false);
      expect(insertCall).toHaveProperty('juizo_digital', false);
      expect(insertCall).toHaveProperty('prioridade_processual', 0);
    });

    it('deve retornar erro CONFLICT para processo duplicado (código 23505)', async () => {
      const processo = criarProcessoMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveProcesso(processo);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('deve converter resultado para Processo com camelCase', async () => {
      const processo = criarProcessoMock();
      const dbData = criarProcessoDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveProcesso(processo);

      if (result.success) {
        expect(result.data).toHaveProperty('numeroProcesso');
        expect(result.data).toHaveProperty('nomeParteAutora');
        expect(result.data).not.toHaveProperty('numero_processo');
      }
    });
  });

  describe('updateProcesso', () => {
    // updateProcesso now takes (id, input, processoExistente, client?) and uses .maybeSingle()
    const existingProcesso = criarProcessoMock();

    it('deve atualizar apenas campos fornecidos (partial update)', async () => {
      const updates = {
        nomeParteAutora: 'Maria Silva',
        dataProximaAudiencia: '2024-02-15',
      };

      const dbData = criarProcessoDbMock({
        nome_parte_autora: 'Maria Silva',
        data_proxima_audiencia: '2024-02-15',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await updateProcesso(1, updates, existingProcesso);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        nomeParteAutora: 'Maria Silva',
        dataProximaAudiencia: '2024-02-15',
        responsavelId: 5,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: criarProcessoDbMock(),
        error: null,
      });

      await updateProcesso(1, updates, existingProcesso);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_parte_autora', 'Maria Silva');
      expect(updateCall).toHaveProperty('data_proxima_audiencia', '2024-02-15');
      expect(updateCall).toHaveProperty('responsavel_id', 5);
    });

    it('deve retornar processo atualizado', async () => {
      const updates = { nomeParteAutora: 'Maria Silva' };
      const dbData = criarProcessoDbMock({ nome_parte_autora: 'Maria Silva' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await updateProcesso(1, updates, existingProcesso);

      if (result.success) {
        expect(result.data).toHaveProperty('nomeParteAutora', 'Maria Silva');
      }
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com campos null', async () => {
      const dbData = criarProcessoDbMock({
        data_arquivamento: null,
        data_proxima_audiencia: null,
        responsavel_id: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoById(1);

      if (result.success && result.data) {
        expect(result.data.dataArquivamento).toBeNull();
        expect(result.data.dataProximaAudiencia).toBeNull();
        expect(result.data.responsavelId).toBeNull();
      }
    });

    it('deve mapear codigoStatusProcesso para enum StatusProcesso', async () => {
      const dbData = criarProcessoDbMock({ status: 'ativo' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findProcessoById(1);

      if (result.success && result.data) {
        expect(result.data.status).toBe(StatusProcesso.ATIVO);
      }
    });
  });
});
