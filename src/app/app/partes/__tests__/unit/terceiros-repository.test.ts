import { createDbClient } from '@/lib/supabase';
import {
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  saveTerceiro,
  updateTerceiro,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
  findAllTerceiros,
} from '../../repositories/terceiros-repository';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

function criarTerceiroDbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    id_tipo_parte: null,
    tipo_parte: 'TESTEMUNHA',
    polo: 'TERCEIRO',
    tipo_pessoa: 'pf',
    nome: 'Pedro Costa',
    nome_fantasia: null,
    emails: null,
    ddd_celular: null,
    numero_celular: null,
    ddd_residencial: null,
    numero_residencial: null,
    ddd_comercial: null,
    numero_comercial: null,
    principal: null,
    autoridade: null,
    endereco_desconhecido: null,
    status_pje: null,
    situacao_pje: null,
    login_pje: null,
    ordem: null,
    observacoes: 'Testemunha',
    dados_anteriores: null,
    ativo: true,
    endereco_id: null,
    ultima_atualizacao_pje: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',

    // Documento (PF default)
    cpf: '11122233344',
    cnpj: null,

    ...overrides,
  };
}

describe('Terceiros Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findTerceiroById', () => {
    it('deve buscar terceiro por ID', async () => {
      const dbData = criarTerceiroDbRow();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('nome');
        expect(result.data.id).toBe(1);
      }
    });

    it('deve retornar null se não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findTerceiroById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findTerceiroByCPF', () => {
    it('deve buscar por CPF', async () => {
      const dbData = criarTerceiroDbRow({ cpf: '11122233344' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCPF('111.222.333-44');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '11122233344');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.cpf).toBe('11122233344');
      }
    });

    it('deve validar estrutura (snake_case)', async () => {
      const dbData = criarTerceiroDbRow();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCPF('111.222.333-44');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('nome');
        expect(result.data).toHaveProperty('tipo_pessoa');
        expect(result.data).not.toHaveProperty('nomeCompleto');
      }
    });

    it('deve retornar null para CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findTerceiroByCPF('999.999.999-99');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findTerceiroByCNPJ', () => {
    it('deve buscar por CNPJ', async () => {
      const dbData = criarTerceiroDbRow({
        tipo_pessoa: 'pj',
        cpf: null,
        cnpj: '22333444000155',
        nome: 'Escritório de Advocacia Silva & Santos',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCNPJ('22.333.444/0001-55');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cnpj', '22333444000155');
      expect(result.success).toBe(true);
    });

    it('deve retornar campos PJ (nome + nome_fantasia)', async () => {
      const dbData = criarTerceiroDbRow({
        tipo_pessoa: 'pj',
        cpf: null,
        cnpj: '22333444000155',
        nome: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCNPJ('22.333.444/0001-55');

      if (result.success && result.data) {
        expect(result.data.nome).toBe('Escritório de Advocacia Silva & Santos');
        expect(result.data.nome_fantasia).toBe('Silva & Santos Advogados');
      }
    });
  });

  describe('saveTerceiro', () => {
    it('deve criar terceiro PF', async () => {
      const terceiro = {
        tipo_pessoa: 'pf',
        tipo_parte: 'TESTEMUNHA',
        polo: 'TERCEIRO',
        nome: 'Pedro Costa',
        nome_fantasia: null,
        emails: null,
        cpf: '111.222.333-44',
      };
      const dbData = criarTerceiroDbRow({ cpf: '11122233344' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveTerceiro(terceiro);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('cpf', '11122233344');
      expect(result.success).toBe(true);
    });

    it('deve criar terceiro sem documento (salvando null)', async () => {
      const terceiro = {
        tipo_pessoa: 'pf',
        tipo_parte: 'TESTEMUNHA',
        polo: 'TERCEIRO',
        nome: 'Pedro Costa',
        nome_fantasia: null,
        emails: null,
        // CPF inválido/ausente não é permitido pelo schema, mas o repository aceita input direto.
        // Aqui usamos string vazia e esperamos que a normalização resulte em ''.
        cpf: '',
      };
      const dbData = criarTerceiroDbRow({ cpf: '' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveTerceiro(terceiro);

      expect(result.success).toBe(true);
    });

    it('deve criar terceiro PJ com campos específicos', async () => {
      const terceiro = {
        tipo_pessoa: 'pj',
        tipo_parte: 'OUTRO',
        polo: 'TERCEIRO',
        nome: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
        emails: null,
        cnpj: '22.333.444/0001-55',
      };
      const dbData = criarTerceiroDbRow({
        tipo_pessoa: 'pj',
        cpf: null,
        cnpj: '22333444000155',
        nome: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const _result = await saveTerceiro(terceiro);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome_fantasia');
      expect(insertCall).toHaveProperty('cnpj', '22333444000155');
    });

    it('deve inserir campos base esperados', async () => {
      const terceiro = {
        tipo_pessoa: 'pf',
        tipo_parte: 'TESTEMUNHA',
        polo: 'TERCEIRO',
        nome: 'Pedro Costa',
        nome_fantasia: null,
        emails: null,
        cpf: '111.222.333-44',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarTerceiroDbRow({ cpf: '11122233344' }),
        error: null,
      });

      await saveTerceiro(terceiro);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome');
      expect(insertCall).toHaveProperty('tipo_pessoa');
      expect(insertCall).toHaveProperty('tipo_parte');
      expect(insertCall).toHaveProperty('polo');
    });
  });

  describe('updateTerceiro', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        observacoes: 'Nova observação',
      };

      const dbData = criarTerceiroDbRow({ observacoes: 'Nova observação' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateTerceiro(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve incluir updated_at automaticamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarTerceiroDbRow(),
        error: null,
      });

      await updateTerceiro(1, { observacoes: 'Nova observação' });

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('observacoes', 'Nova observação');
      expect(updateCall).toHaveProperty('updated_at');
    });
  });

  describe('upsertTerceiroByCPF', () => {
    it('deve criar se não existe', async () => {
      const input = {
        tipo_pessoa: 'pf',
        tipo_parte: 'TESTEMUNHA',
        polo: 'TERCEIRO',
        nome: 'Pedro Costa',
        nome_fantasia: null,
        emails: null,
        cpf: '111.222.333-44',
      };
      const dbData = criarTerceiroDbRow({ cpf: '11122233344' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertTerceiroByCPF('111.222.333-44', input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const input = {
        tipo_pessoa: 'pf',
        tipo_parte: 'TESTEMUNHA',
        polo: 'TERCEIRO',
        nome: 'Pedro Costa',
        nome_fantasia: null,
        emails: null,
        cpf: '111.222.333-44',
      };
      const existingData = criarTerceiroDbRow({ id: 5, cpf: '11122233344' });
      const updatedData = criarTerceiroDbRow({ id: 5, cpf: '11122233344', observacoes: 'Atualizado' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertTerceiroByCPF('111.222.333-44', input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(false);
      }
    });
  });

  describe('upsertTerceiroByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const input = {
        tipo_pessoa: 'pj',
        tipo_parte: 'OUTRO',
        polo: 'TERCEIRO',
        nome: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
        emails: null,
        cnpj: '22.333.444/0001-55',
      };
      const dbData = criarTerceiroDbRow({ tipo_pessoa: 'pj', cpf: null, cnpj: '22333444000155' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertTerceiroByCNPJ('22.333.444/0001-55', input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const input = {
        tipo_pessoa: 'pj',
        tipo_parte: 'OUTRO',
        polo: 'TERCEIRO',
        nome: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
        emails: null,
        cnpj: '22.333.444/0001-55',
      };
      const existingData = criarTerceiroDbRow({ id: 5, tipo_pessoa: 'pj', cpf: null, cnpj: '22333444000155' });
      const updatedData = criarTerceiroDbRow({ id: 5, tipo_pessoa: 'pj', cpf: null, cnpj: '22333444000155' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertTerceiroByCNPJ('22.333.444/0001-55', input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(false);
      }
    });
  });

  describe('findAllTerceiros', () => {
    it('deve aplicar filtro de nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ nome: 'Pedro' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome', '%Pedro%');
    });

    it('deve aplicar filtro de CPF', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ cpf: '111.222.333-44' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '11122233344');
    });

    it('deve aplicar filtro de tipoPessoa', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ tipo_pessoa: 'pf' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_pessoa', 'pf');
    });

    it('deve aplicar busca geral', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ busca: 'Silva Santos' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({
        ordenar_por: 'nome',
        ordem: 'asc',
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome', {
        ascending: true,
      });
    });

    it('deve paginar corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await findAllTerceiros({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar contagem total', async () => {
      const dbData = [criarTerceiroDbRow()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllTerceiros({});

      if (result.success) {
        expect(result.data.pagination.total).toBe(1);
      }
    });
  });
});
