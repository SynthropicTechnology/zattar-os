import { revalidatePath } from 'next/cache';
import { requireAuth } from '../../actions/utils';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import { obterTodasPermissoes, validarAtribuirPermissaoDTO } from '../../types/types';
import {
  actionListarPermissoes,
  actionSalvarPermissoes,
} from '../../actions/permissoes-actions';
import { criarPermissaoMock, criarSuperAdminMock } from '../fixtures';

// Mocks
jest.mock('../../actions/utils');
jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client');
jest.mock('../../types/types');
jest.mock('next/cache');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRepository = repository as jest.Mocked<typeof repository>;
const mockCreateServiceClient = createServiceClient as jest.MockedFunction<typeof createServiceClient>;
const mockObterTodasPermissoes = obterTodasPermissoes as jest.MockedFunction<typeof obterTodasPermissoes>;
const mockValidarAtribuirPermissaoDTO = validarAtribuirPermissaoDTO as jest.MockedFunction<typeof validarAtribuirPermissaoDTO>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

interface MockSupabaseClient {
  from: jest.Mock;
}

describe('Permissoes Actions - Unit Tests', () => {
  const mockUser = { userId: 1 };
  const mockPermissao = criarPermissaoMock();
  const mockSuperAdmin = criarSuperAdminMock();

  const mockSupabase: MockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser);
    // createServiceClient is now sync (returns client directly)
    mockCreateServiceClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceClient>);
    // validarAtribuirPermissaoDTO is mocked as part of '../../types/types' — default to valid
    mockValidarAtribuirPermissaoDTO.mockReturnValue(true);
  });

  describe('actionListarPermissoes', () => {
    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionListarPermissoes(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });

    it('deve retornar todas as permissões para super admin', async () => {
      const todasPermissoes = [
        mockPermissao,
        criarPermissaoMock({ recurso: 'documentos', operacao: 'criar' }),
        criarPermissaoMock({ recurso: 'documentos', operacao: 'editar' }),
      ];
      mockObterTodasPermissoes.mockReturnValue(todasPermissoes);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockSuperAdmin.id, is_super_admin: true },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      const result = await actionListarPermissoes(mockSuperAdmin.id);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        usuario_id: mockSuperAdmin.id,
        is_super_admin: true,
      }));
      expect(mockRepository.listarPermissoesUsuario).not.toHaveBeenCalled();
    });

    it('deve retornar permissões do banco para usuário normal', async () => {
      const permissoesUsuario = [
        mockPermissao,
        criarPermissaoMock({ recurso: 'processos', operacao: 'criar' }),
      ];
      mockRepository.listarPermissoesUsuario.mockResolvedValue(permissoesUsuario);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, is_super_admin: false },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      const result = await actionListarPermissoes(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        usuario_id: 1,
        is_super_admin: false,
      }));
      expect(mockRepository.listarPermissoesUsuario).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro quando usuário não encontrado', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Usuário não encontrado' },
            }),
          }),
        }),
      } as any);

      const result = await actionListarPermissoes(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não encontrado');
    });

    it('deve verificar permissão usuarios:visualizar', async () => {
      mockRepository.listarPermissoesUsuario.mockResolvedValue([]);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, is_super_admin: false },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      await actionListarPermissoes(1);

      expect(mockRequireAuth).toHaveBeenCalledWith(['usuarios:visualizar']);
    });
  });

  describe('actionSalvarPermissoes', () => {
    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionSalvarPermissoes(1, [mockPermissao]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });

    it('deve salvar permissões com sucesso', async () => {
      const permissoes = [
        mockPermissao,
        criarPermissaoMock({ recurso: 'documentos', operacao: 'criar' }),
        criarPermissaoMock({ recurso: 'documentos', operacao: 'editar' }),
      ];
      mockRepository.substituirPermissoes.mockResolvedValue(undefined);

      const result = await actionSalvarPermissoes(1, permissoes);

      expect(result.success).toBe(true);
      expect(mockRepository.substituirPermissoes).toHaveBeenCalledWith(1, permissoes, mockUser.userId);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios/1');
    });

    it('deve validar array de permissões', async () => {
      mockRepository.substituirPermissoes.mockResolvedValue(undefined);

      const permissoes = [
        mockPermissao,
        criarPermissaoMock({ recurso: 'processos', operacao: 'criar', permitido: false }),
      ];
      const result = await actionSalvarPermissoes(1, permissoes);

      expect(result.success).toBe(true);
      expect(mockRepository.substituirPermissoes).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ recurso: 'processos', operacao: 'visualizar', permitido: true }),
          expect.objectContaining({ recurso: 'processos', operacao: 'criar', permitido: false }),
        ]),
        mockUser.userId
      );
    });

    it('deve retornar erro quando repository falha', async () => {
      mockRepository.substituirPermissoes.mockRejectedValue(new Error('Erro ao salvar permissões'));

      const result = await actionSalvarPermissoes(1, [mockPermissao]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao salvar permissões');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('deve verificar permissão usuarios:gerenciar_permissoes', async () => {
      mockRepository.substituirPermissoes.mockResolvedValue(undefined);

      await actionSalvarPermissoes(1, [mockPermissao]);

      expect(mockRequireAuth).toHaveBeenCalledWith(['usuarios:gerenciar_permissoes']);
    });

    it('deve manter estrutura de permissão (recurso, operacao, permitido)', async () => {
      mockRepository.substituirPermissoes.mockResolvedValue(undefined);

      const permissoes = [
        { recurso: 'processos', operacao: 'visualizar', permitido: true },
        { recurso: 'processos', operacao: 'editar', permitido: false },
      ];

      await actionSalvarPermissoes(1, permissoes);

      expect(mockRepository.substituirPermissoes).toHaveBeenCalledWith(
        1,
        permissoes,
        mockUser.userId
      );
    });
  });
});
