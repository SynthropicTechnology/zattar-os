import { createDbClient } from '@/lib/supabase';
import {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNomeParcial,
  findAllClientes,
  saveCliente,
  updateCliente,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  countClientes,
  countClientesByDateRange,
  countClientesByEstado,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  findClienteComEndereco,
} from '../../repositories/clientes-repository';
import {
  criarClientePFMock,
  criarClientePJMock,
  criarClienteDbMock,
  criarEnderecoDbMock,
} from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

describe('Clientes Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findClienteById', () => {
    it('deve buscar cliente por ID', async () => {
      const dbData = criarClienteDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
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

      const result = await findClienteById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('deve retornar erro para falhas de banco', async () => {
      const error = mockPostgresError('42P01', 'Table does not exist');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findClienteById(1);

      expect(result.success).toBe(false);
    });
  });

  describe('findClienteByCPF', () => {
    it('deve buscar por CPF', async () => {
      const dbData = criarClienteDbMock({ cpf: '123.456.789-00' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCPF('123.456.789-00');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '123.456.789-00');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.cpf).toBe('123.456.789-00');
      }
    });

    it('deve validar mapeamento camelCase', async () => {
      const dbData = criarClienteDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCPF('123.456.789-00');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('nomeCompleto');
        expect(result.data).toHaveProperty('dataNascimento');
        expect(result.data).not.toHaveProperty('nome_completo');
      }
    });

    it('deve retornar null para CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findClienteByCPF('999.999.999-99');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findClienteByCNPJ', () => {
    it('deve buscar por CNPJ', async () => {
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'PJ',
        cnpj: '12.345.678/0001-00',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCNPJ('12.345.678/0001-00');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cnpj', '12.345.678/0001-00');
      expect(result.success).toBe(true);
    });

    it('deve validar mapeamento de campos PJ', async () => {
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Empresa XYZ Ltda',
        nome_fantasia: 'XYZ Soluções',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCNPJ('12.345.678/0001-00');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('razaoSocial');
        expect(result.data).toHaveProperty('nomeFantasia');
      }
    });
  });

  describe('findClientesByNomeParcial', () => {
    it('deve buscar com ilike', async () => {
      const dbData = [criarClienteDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.limit.mockResolvedValue({ data: dbData, error: null });

      await findClientesByNomeParcial('João');

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome', '%João%');
    });

    it('deve aplicar paginação', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await findClientesByNomeParcial('João', 20);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('deve ordenar por nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await findClientesByNomeParcial('João');

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome');
    });
  });

  describe('findAllClientes', () => {
    it('deve aplicar filtro de nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ nome: 'João' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome', '%João%');
    });

    it('deve aplicar filtro de CPF/CNPJ', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ cpfCnpj: '123.456.789-00' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve aplicar filtro de tipoPessoa', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ tipoPessoa: 'PF' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_pessoa', 'PF');
    });

    it('deve aplicar filtro de status ativo', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ ativo: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('deve aplicar busca geral', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ busca: 'João Silva' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({
        ordenarPor: 'nomeCompleto',
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

      await findAllClientes({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar contagem total', async () => {
      const dbData = [criarClienteDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllClientes({});

      if (result.success) {
        expect(result.total).toBe(1);
      }
    });
  });

  describe('saveCliente', () => {
    it('deve inserir cliente PF com todos os campos', async () => {
      const cliente = criarClientePFMock();
      const dbData = criarClienteDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveCliente(cliente);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve inserir cliente PJ com campos específicos', async () => {
      const cliente = criarClientePJMock();
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Empresa XYZ Ltda',
        nome_fantasia: 'XYZ Soluções',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const _result = await saveCliente(cliente);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('razao_social');
      expect(insertCall).toHaveProperty('nome_fantasia');
    });

    it('deve aplicar valores padrão', async () => {
      const cliente = criarClientePFMock({
        ativo: undefined as any,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await saveCliente(cliente);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('ativo', true);
    });

    it('deve retornar erro para CPF duplicado', async () => {
      const cliente = criarClientePFMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveCliente(cliente);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('deve retornar erro para CNPJ duplicado', async () => {
      const cliente = criarClientePJMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveCliente(cliente);

      expect(result.success).toBe(false);
    });
  });

  describe('updateCliente', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      };

      const dbData = criarClienteDbMock({
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateCliente(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve preservar campos não fornecidos', async () => {
      const updates = { email: 'novo.email@example.com' };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await updateCliente(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(Object.keys(updateCall).length).toBeGreaterThan(0);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        nomeCompleto: 'João Silva Santos Junior',
        dataNascimento: '1980-05-15',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await updateCliente(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_completo');
      expect(updateCall).toHaveProperty('data_nascimento');
    });
  });

  describe('upsertClienteByCPF', () => {
    it('deve criar se não existe', async () => {
      const cliente = criarClientePFMock();
      const dbData = criarClienteDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertClienteByCPF(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const cliente = criarClientePFMock();
      const existingData = criarClienteDbMock({ id: 5 });
      const updatedData = criarClienteDbMock({ id: 5, email: cliente.email });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertClienteByCPF(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });

    it('deve retornar flag created corretamente', async () => {
      const cliente = criarClientePFMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      const result = await upsertClienteByCPF(cliente);

      expect(result).toHaveProperty('created');
    });
  });

  describe('upsertClienteByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const cliente = criarClientePJMock();
      const dbData = criarClienteDbMock({ tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertClienteByCNPJ(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const cliente = criarClientePJMock();
      const existingData = criarClienteDbMock({ id: 5, tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: existingData, error: null });

      const result = await upsertClienteByCNPJ(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('countClientes', () => {
    it('deve contar total de clientes', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: { count: 42 }, error: null });

      const result = await countClientes();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });
  });

  describe('countClientesByDateRange', () => {
    it('deve contar por intervalo de datas', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: { count: 15 }, error: null });

      const result = await countClientesByDateRange('2024-01-01', '2024-12-31');

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
      expect(result.success).toBe(true);
    });
  });

  describe('countClientesByEstado', () => {
    it('deve agrupar por estado (UF)', async () => {
      const dbData = [
        { uf: 'SP', count: 25 },
        { uf: 'RJ', count: 10 },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: dbData, error: null });

      const result = await countClientesByEstado();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toHaveProperty('uf', 'SP');
        expect(result.data[0]).toHaveProperty('count', 25);
      }
    });
  });

  describe('findAllClientesComEndereco', () => {
    it('deve fazer join com tabela enderecos', async () => {
      const dbData = [
        {
          ...criarClienteDbMock(),
          enderecos: [criarEnderecoDbMock()],
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: dbData.length });

      const result = await findAllClientesComEndereco();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(result.success).toBe(true);
    });
  });

  describe('findAllClientesComEnderecoEProcessos', () => {
    it('deve fazer join com enderecos e processo_partes', async () => {
      const clienteRow = {
        ...criarClienteDbMock({ id: 1 }),
        enderecos: [criarEnderecoDbMock()],
      };

      const mockClientesQB = createMockQueryBuilder();
      const mockProcessoPartesQB = createMockQueryBuilder();

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'clientes') return mockClientesQB;
        if (table === 'processo_partes') return mockProcessoPartesQB;
        return mockQueryBuilder;
      });

      mockClientesQB.range.mockResolvedValue({ data: [clienteRow], error: null, count: 1 });
      mockProcessoPartesQB.range.mockResolvedValue({
        data: [
          {
            processo_id: 100,
            numero_processo: '0000000-00.0000.0.00.0000',
            tipo_parte: 'autor',
            polo: 'ativo',
            entidade_id: 1,
          },
        ],
        error: null,
        count: 1,
      });

      const result = await findAllClientesComEnderecoEProcessos();

      expect(result.success).toBe(true);
    });
  });

  describe('findClienteComEndereco', () => {
    it('deve buscar cliente único com endereço', async () => {
      const dbData = {
        ...criarClienteDbMock(),
        enderecos: [criarEnderecoDbMock()],
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteComEndereco(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('enderecos');
      }
    });
  });
});
