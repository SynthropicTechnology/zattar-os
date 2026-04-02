import { createDbClient } from '@/lib/supabase';
import {
  vincularParteAoProcesso,
  listarPartesDoProcesso,
  listarProcessosDaParte,
  desvincularParteDoProcesso,
  atualizarVinculoProcessoParte,
  buscarVinculoPorId,
} from '../../repositories/processo-partes-repository';
import { criarProcessoPartesDbMock } from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

/**
 * Makes a mockQueryBuilder thenable so `await query` resolves to the given value.
 * Also keeps all methods chainable (returning the builder itself).
 */
function makeThenable(builder: any, resolvedValue: { data: any; error: any }) {
  builder.then = (resolve: any, reject?: any) => Promise.resolve(resolvedValue).then(resolve, reject);
  builder.catch = (fn: any) => Promise.resolve(resolvedValue).catch(fn);
  return builder;
}

describe('Processo Partes Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('vincularParteAoProcesso', () => {
    it('deve criar vínculo processo-parte', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      const dbData = criarProcessoPartesDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await vincularParteAoProcesso(vinculo);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve validar tipoEntidade (cliente, parte_contraria, terceiro)', async () => {
      const vinculoCliente = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock(),
        error: null,
      });

      await vincularParteAoProcesso(vinculoCliente);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('entidade_tipo', 'cliente');
    });

    it('deve validar tipoParticipacao (autor, reu, terceiro_interessado)', async () => {
      const vinculoAutor = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock(),
        error: null,
      });

      await vincularParteAoProcesso(vinculoAutor);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('tipo_participacao', 'autor');
    });

    it('deve mapear camelCase → snake_case', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'parte_contraria' as const,
        entidadeId: 2,
        tipoParticipacao: 'reu' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({
          entidade_tipo: 'parte_contraria',
          entidade_id: 2,
          tipo_participacao: 'reu',
        }),
        error: null,
      });

      await vincularParteAoProcesso(vinculo);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('processo_id', 100);
      expect(insertCall).toHaveProperty('entidade_tipo', 'parte_contraria');
      expect(insertCall).toHaveProperty('entidade_id', 2);
      expect(insertCall).toHaveProperty('tipo_participacao', 'reu');
    });

    it('deve retornar erro para vínculo duplicado', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      const error = mockPostgresError('23505', 'Unique constraint violation');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await vincularParteAoProcesso(vinculo);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });
  });

  describe('listarPartesDoProcesso', () => {
    it('deve buscar partes vinculadas a processo', async () => {
      const dbData = [
        criarProcessoPartesDbMock(),
        criarProcessoPartesDbMock({
          id: 2,
          entidade_tipo: 'parte_contraria',
          entidade_id: 5,
          tipo_participacao: 'reu',
        }),
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: dbData, error: null });

      const result = await listarPartesDoProcesso(100);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('processo_id', 100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve filtrar por tipoEntidade se fornecido', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: [], error: null });

      await listarPartesDoProcesso(100, 'cliente');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('processo_id', 100);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entidade_tipo', 'cliente');
    });

    it('deve filtrar por tipoParticipacao se fornecido', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: [], error: null });

      await listarPartesDoProcesso(100, undefined, 'autor');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('processo_id', 100);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_participacao', 'autor');
    });

    it('deve retornar array vazio se não houver partes', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: [], error: null });

      const result = await listarPartesDoProcesso(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('deve mapear campos para camelCase', async () => {
      const dbData = [criarProcessoPartesDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: dbData, error: null });

      const result = await listarPartesDoProcesso(100);

      if (result.success && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('processoId');
        expect(result.data[0]).toHaveProperty('entidadeTipo');
        expect(result.data[0]).toHaveProperty('entidadeId');
        expect(result.data[0]).toHaveProperty('tipoParticipacao');
        expect(result.data[0]).not.toHaveProperty('processo_id');
      }
    });
  });

  describe('listarProcessosDaParte', () => {
    it('deve buscar processos vinculados a parte', async () => {
      const dbData = [
        criarProcessoPartesDbMock(),
        criarProcessoPartesDbMock({
          id: 2,
          processo_id: 200,
        }),
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: dbData, error: null });

      const result = await listarProcessosDaParte('cliente', 1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entidade_tipo', 'cliente');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entidade_id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve filtrar por tipoParticipacao se fornecido', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: [], error: null });

      await listarProcessosDaParte('cliente', 1, 'autor');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entidade_tipo', 'cliente');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entidade_id', 1);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_participacao', 'autor');
    });

    it('deve retornar array vazio se não houver processos', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: [], error: null });

      const result = await listarProcessosDaParte('cliente', 999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('desvincularParteDoProcesso', () => {
    it('deve remover vínculo', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: null, error: null });

      const result = await desvincularParteDoProcesso(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve retornar sucesso mesmo se vínculo não existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: null, error: null });

      const result = await desvincularParteDoProcesso(999);

      expect(result.success).toBe(true);
    });

    it('deve retornar erro para falhas de banco', async () => {
      const error = mockPostgresError('42P01', 'Table does not exist');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      makeThenable(mockQueryBuilder, { data: null, error });

      const result = await desvincularParteDoProcesso(1);

      expect(result.success).toBe(false);
    });
  });

  describe('atualizarVinculoProcessoParte', () => {
    it('deve atualizar vínculo', async () => {
      const updates = {
        tipoParticipacao: 'reu' as const,
      };

      const dbData = criarProcessoPartesDbMock({
        id: 1,
        tipo_participacao: 'reu',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await atualizarVinculoProcessoParte(1, updates);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        tipoParticipacao: 'terceiro_interessado' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock(),
        error: null,
      });

      await atualizarVinculoProcessoParte(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('tipo_participacao', 'terceiro_interessado');
    });
  });

  describe('buscarVinculoPorId', () => {
    it('deve buscar vínculo por ID', async () => {
      const dbData = criarProcessoPartesDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await buscarVinculoPorId(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('processo_partes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('id', 1);
      }
    });

    it('deve retornar null se não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await buscarVinculoPorId(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('Validações de Tipos', () => {
    it('deve aceitar entidadeTipo: cliente', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock(),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });

    it('deve aceitar entidadeTipo: parte_contraria', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'parte_contraria' as const,
        entidadeId: 2,
        tipoParticipacao: 'reu' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({ entidade_tipo: 'parte_contraria' }),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });

    it('deve aceitar entidadeTipo: terceiro', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'terceiro' as const,
        entidadeId: 3,
        tipoParticipacao: 'terceiro_interessado' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({ entidade_tipo: 'terceiro' }),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });

    it('deve aceitar tipoParticipacao: autor', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'cliente' as const,
        entidadeId: 1,
        tipoParticipacao: 'autor' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({ tipo_participacao: 'autor' }),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });

    it('deve aceitar tipoParticipacao: reu', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'parte_contraria' as const,
        entidadeId: 2,
        tipoParticipacao: 'reu' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({ tipo_participacao: 'reu' }),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });

    it('deve aceitar tipoParticipacao: terceiro_interessado', async () => {
      const vinculo = {
        processoId: 100,
        entidadeTipo: 'terceiro' as const,
        entidadeId: 3,
        tipoParticipacao: 'terceiro_interessado' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarProcessoPartesDbMock({ tipo_participacao: 'terceiro_interessado' }),
        error: null,
      });

      const result = await vincularParteAoProcesso(vinculo);
      expect(result.success).toBe(true);
    });
  });
});
