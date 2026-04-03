/**
 * Testes de Integração para Auth Authorization
 *
 * Valida verificação de permissões granulares incluindo:
 * - Cache de permissões
 * - Bypass para super admin
 * - Verificação de permissões múltiplas
 * - Invalidação de cache
 */

import {
  checkPermission,
  checkMultiplePermissions,
  invalidarCacheUsuario,
  getCacheStats,
} from '@/lib/auth/authorization';
import { createServiceClient } from '@/lib/supabase/service-client';
import { isPermissaoValida } from '@/app/(authenticated)/usuarios';
import type { Recurso, Operacao } from '@/app/(authenticated)/usuarios';
import type { SupabaseClient as _SupabaseClient } from '@supabase/supabase-js';

// Mocks
jest.mock('@/lib/supabase/service-client');
jest.mock('@/app/(authenticated)/usuarios', () => ({
  isPermissaoValida: jest.fn(),
}));

interface MockSupabaseClient {
  from: jest.Mock;
}

describe('Auth - Authorization', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Criar mock do Supabase
    mockSupabase = {
      from: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);

    // Por padrão, todas as permissões são válidas
    (isPermissaoValida as jest.Mock).mockReturnValue(true);

    // Limpar cache antes de cada teste
    invalidarCacheUsuario(1);
    invalidarCacheUsuario(2);
    invalidarCacheUsuario(3);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkPermission', () => {
    describe('Validação de Permissão', () => {
      it('deve retornar false para permissão inválida', async () => {
        // Arrange
        (isPermissaoValida as jest.Mock).mockReturnValue(false);

        // Act
        const result = await checkPermission(1, 'recurso_invalido', 'operacao_invalida');

        // Assert
        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Tentativa de verificar permissão inválida')
        );
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it('deve validar recurso e operação antes de consultar banco', async () => {
        // Arrange
        (isPermissaoValida as jest.Mock).mockReturnValue(false);

        // Act
        await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(isPermissaoValida).toHaveBeenCalledWith('processos', 'criar');
      });
    });

    describe('Super Admin Bypass', () => {
      it('deve retornar true para super admin (bypass)', async () => {
        // Arrange
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_super_admin: true },
                error: null,
              }),
            }),
          }),
        });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('usuarios');
      });

      it('deve cachear resultado de super admin', async () => {
        // Arrange
        const selectMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_super_admin: true },
              error: null,
            }),
          }),
        });
        mockSupabase.from.mockReturnValue({ select: selectMock });

        // Act
        await checkPermission(1, 'processos', 'criar');
        await checkPermission(1, 'processos', 'criar'); // Segunda chamada

        // Assert
        expect(selectMock).toHaveBeenCalledTimes(1); // Apenas uma consulta ao banco
      });

      it('não deve consultar permissões para super admin', async () => {
        // Arrange
        const fromMock = jest.fn();
        mockSupabase.from = fromMock;

        fromMock.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_super_admin: true },
                error: null,
              }),
            }),
          }),
        });

        // Act
        await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(fromMock).toHaveBeenCalledTimes(1); // Apenas busca de is_super_admin
        expect(fromMock).toHaveBeenCalledWith('usuarios');
      });
    });

    describe('Verificação de Permissões Normal', () => {
      it('deve retornar true quando usuário tem permissão', async () => {
        // Arrange
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { permitido: true },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(true);
      });

      it('deve retornar false quando usuário não tem permissão', async () => {
        // Arrange
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { permitido: false },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(false);
      });

      it('deve retornar false quando permissão não existe (PGRST116)', async () => {
        // Arrange
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116', message: 'No rows found' },
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(false);
      });

      it('deve consultar permissões com filtros corretos', async () => {
        // Arrange
        const eqMocks = {
          usuario_id: jest.fn(),
          recurso: jest.fn(),
          operacao: jest.fn(),
        };

        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: eqMocks.usuario_id.mockReturnValue({
                eq: eqMocks.recurso.mockReturnValue({
                  eq: eqMocks.operacao.mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { permitido: true },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(eqMocks.usuario_id).toHaveBeenCalledWith('usuario_id', 1);
        expect(eqMocks.recurso).toHaveBeenCalledWith('recurso', 'processos');
        expect(eqMocks.operacao).toHaveBeenCalledWith('operacao', 'criar');
      });
    });

    describe('Cache de Permissões', () => {
      it('deve cachear resultado de permissão permitida', async () => {
        // Arrange
        const fromMock = jest.fn();
        mockSupabase.from = fromMock;

        fromMock
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { permitido: true },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result1 = await checkPermission(1, 'processos', 'criar');
        const result2 = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(fromMock).toHaveBeenCalledTimes(2); // Apenas consulta inicial
      });

      it('deve cachear resultado de permissão negada', async () => {
        // Arrange
        const fromMock = jest.fn();
        mockSupabase.from = fromMock;

        fromMock
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        await checkPermission(1, 'processos', 'criar');
        await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(fromMock).toHaveBeenCalledTimes(2);
      });

      it('deve usar chaves de cache diferentes para diferentes permissões', async () => {
        // Arrange
        const stats1 = getCacheStats();

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_super_admin: true },
                error: null,
              }),
            }),
          }),
        });

        // Act
        await checkPermission(1, 'processos', 'criar');
        await checkPermission(1, 'processos', 'editar');
        await checkPermission(1, 'contratos', 'criar');
        const stats2 = getCacheStats();

        // Assert
        expect(stats2.total).toBeGreaterThan(stats1.total);
      });
    });

    describe('Tratamento de Erros', () => {
      it('deve lidar com erro de coluna is_super_admin não existir', async () => {
        // Arrange
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: {
                    code: 'PGRST204',
                    message: 'column "is_super_admin" does not exist',
                  },
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { permitido: true },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(true);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Campo is_super_admin não encontrado')
        );
      });

      it('deve retornar false em caso de erro ao buscar usuário', async () => {
        // Arrange
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST000', message: 'Database error' },
              }),
            }),
          }),
        });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });

      it('deve retornar false em caso de erro ao buscar permissão', async () => {
        // Arrange
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST000', message: 'Database error' },
                    }),
                  }),
                }),
              }),
            }),
          });

        // Act
        const result = await checkPermission(1, 'processos', 'criar');

        // Assert
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('checkMultiplePermissions', () => {
    it('deve retornar true quando usuário tem todas as permissões (requireAll=true)', async () => {
      // Arrange
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'usuarios') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { permitido: true },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      });

      // Act
      const result = await checkMultiplePermissions(
        1,
        [
          ['processos' as Recurso, 'criar' as Operacao],
          ['processos' as Recurso, 'editar' as Operacao],
        ],
        true
      );

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando falta alguma permissão (requireAll=true)', async () => {
      // Arrange
      let permissionCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'usuarios') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: permissionCallCount++ === 0 ? { permitido: true } : null,
                    error: permissionCallCount > 1 ? { code: 'PGRST116' } : null,
                  }),
                }),
              }),
            }),
          }),
        };
      });

      // Act
      const result = await checkMultiplePermissions(
        1,
        [
          ['processos' as Recurso, 'criar' as Operacao],
          ['processos' as Recurso, 'deletar' as Operacao],
        ],
        true
      );

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar true quando tem pelo menos uma permissão (requireAll=false)', async () => {
      // Arrange
      let permissionCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'usuarios') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_super_admin: false },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: permissionCallCount++ === 0 ? { permitido: true } : null,
                    error: permissionCallCount > 1 ? { code: 'PGRST116' } : null,
                  }),
                }),
              }),
            }),
          }),
        };
      });

      // Act
      const result = await checkMultiplePermissions(
        1,
        [
          ['processos' as Recurso, 'criar' as Operacao],
          ['processos' as Recurso, 'deletar' as Operacao],
        ],
        false
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('invalidarCacheUsuario deve remover entradas do cache', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_super_admin: true },
              error: null,
            }),
          }),
        }),
      });

      await checkPermission(1, 'processos', 'criar');
      const stats1 = getCacheStats();

      // Act
      invalidarCacheUsuario(1);
      const stats2 = getCacheStats();

      // Assert
      expect(stats2.total).toBeLessThan(stats1.total);
    });

    it('getCacheStats deve retornar estatísticas corretas', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_super_admin: true },
              error: null,
            }),
          }),
        }),
      });

      // Act
      await checkPermission(1, 'processos', 'criar');
      await checkPermission(1, 'processos', 'editar');
      const stats = getCacheStats();

      // Assert
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.ativas).toBeGreaterThanOrEqual(0);
      expect(stats.expiradas).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBe(stats.ativas + stats.expiradas);
    });
  });
});
