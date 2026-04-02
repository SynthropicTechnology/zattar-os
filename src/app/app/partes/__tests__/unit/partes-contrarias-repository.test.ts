import { createDbClient } from '@/lib/supabase';
import {
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findParteContrariaById,
  saveParteContraria,
  updateParteContraria,
  findAllPartesContrarias,
  upsertParteContrariaByCPF,
  upsertParteContrariaByCNPJ,
} from '../../repositories/partes-contrarias-repository';
import {
  criarParteContrariaPFMock,
  criarParteContrariaPJMock,
  criarParteContrariaDbMock,
} from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

describe('Partes Contrárias Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findParteContrariaById', () => {
    it('deve buscar parte contrária por ID', async () => {
      const dbData = criarParteContrariaDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('nomeCompleto');
        expect(result.data.id).toBe(1);
      }
    });

    it('deve retornar null se não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findParteContrariaById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findParteContrariaByCPF', () => {
    it('deve buscar por CPF', async () => {
      const dbData = criarParteContrariaDbMock({ cpf: '987.654.321-00' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCPF('987.654.321-00');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '987.654.321-00');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.cpf).toBe('987.654.321-00');
      }
    });

    it('deve validar mapeamento camelCase', async () => {
      const dbData = criarParteContrariaDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCPF('987.654.321-00');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('nomeCompleto');
        expect(result.data).toHaveProperty('tipoPessoa');
        expect(result.data).not.toHaveProperty('nome_completo');
      }
    });

    it('deve retornar null para CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findParteContrariaByCPF('999.999.999-99');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findParteContrariaByCNPJ', () => {
    it('deve buscar por CNPJ', async () => {
      const dbData = criarParteContrariaDbMock({
        tipo_pessoa: 'PJ',
        cnpj: '98.765.432/0001-00',
        razao_social: 'Empresa ABC S/A',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCNPJ('98.765.432/0001-00');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cnpj', '98.765.432/0001-00');
      expect(result.success).toBe(true);
    });

    it('deve validar mapeamento de campos PJ', async () => {
      const dbData = criarParteContrariaDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Empresa ABC S/A',
        nome_fantasia: 'ABC Corp',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCNPJ('98.765.432/0001-00');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('razaoSocial');
        expect(result.data).toHaveProperty('nomeFantasia');
      }
    });
  });

  describe('saveParteContraria', () => {
    it('deve inserir parte contrária PF', async () => {
      const parte = criarParteContrariaPFMock();
      const dbData = criarParteContrariaDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveParteContraria(parte);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve inserir parte contrária PJ com campos específicos', async () => {
      const parte = criarParteContrariaPJMock();
      const dbData = criarParteContrariaDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Empresa ABC S/A',
        nome_fantasia: 'ABC Corp',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const _result = await saveParteContraria(parte);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('razao_social');
      expect(insertCall).toHaveProperty('nome_fantasia');
    });

    it('deve retornar erro para CPF duplicado', async () => {
      const parte = criarParteContrariaPFMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveParteContraria(parte);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('deve mapear camelCase → snake_case', async () => {
      const parte = criarParteContrariaPFMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarParteContrariaDbMock(),
        error: null,
      });

      await saveParteContraria(parte);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome_completo');
      expect(insertCall).toHaveProperty('tipo_pessoa');
    });
  });

  describe('updateParteContraria', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        email: 'novo.email@example.com',
        telefone: '(21) 99999-8888',
      };

      const dbData = criarParteContrariaDbMock({
        email: 'novo.email@example.com',
        telefone: '(21) 99999-8888',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateParteContraria(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        nomeCompleto: 'Maria Oliveira Silva',
        observacoes: 'Atualização de dados',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarParteContrariaDbMock(),
        error: null,
      });

      await updateParteContraria(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_completo');
      expect(updateCall).toHaveProperty('observacoes');
    });
  });

  describe('findAllPartesContrarias', () => {
    it('deve aplicar filtro de nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ nome: 'Maria' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome_completo', '%Maria%');
    });

    it('deve aplicar filtro de CPF/CNPJ', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ cpfCnpj: '987.654.321-00' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve aplicar filtro de tipoPessoa', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ tipoPessoa: 'PJ' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_pessoa', 'PJ');
    });

    it('deve aplicar busca geral', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ busca: 'Empresa ABC' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({
        ordenarPor: 'nomeCompleto',
        ordem: 'asc',
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome_completo', {
        ascending: true,
      });
    });

    it('deve paginar corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await findAllPartesContrarias({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar contagem total', async () => {
      const dbData = [criarParteContrariaDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllPartesContrarias({});

      if (result.success) {
        expect(result.total).toBe(1);
      }
    });
  });

  describe('upsertParteContrariaByCPF', () => {
    it('deve criar se não existe', async () => {
      const parte = criarParteContrariaPFMock();
      const dbData = criarParteContrariaDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertParteContrariaByCPF(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const parte = criarParteContrariaPFMock();
      const existingData = criarParteContrariaDbMock({ id: 5 });
      const updatedData = criarParteContrariaDbMock({ id: 5, email: parte.email });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertParteContrariaByCPF(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('upsertParteContrariaByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const parte = criarParteContrariaPJMock();
      const dbData = criarParteContrariaDbMock({ tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertParteContrariaByCNPJ(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const parte = criarParteContrariaPJMock();
      const existingData = criarParteContrariaDbMock({ id: 5, tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: existingData, error: null });

      const result = await upsertParteContrariaByCNPJ(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });
});
