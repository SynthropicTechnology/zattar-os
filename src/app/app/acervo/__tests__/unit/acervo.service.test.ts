
import {
  obterAcervoPaginado,
  atribuirResponsavel
} from '../../service';
import {
  listarAcervo,
  atribuirResponsavel as atribuirResponsavelRepo,
  buscarAcervoPorId
} from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';

// Mock dependencies
jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(),
}));

describe('Acervo Service', () => {
  const mockParams = {};
  const mockResult = {
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obterAcervoPaginado', () => {
    it('deve retornar lista de processos paginada', async () => {
      // Arrange
      (listarAcervo as jest.Mock).mockResolvedValue(mockResult);

      // Act
      const result = await obterAcervoPaginado(mockParams);

      // Assert
      expect(result).toEqual(mockResult);
      expect(listarAcervo).toHaveBeenCalledWith({ ...mockParams, unified: false });
    });
  });

  describe('atribuirResponsavel', () => {
    it('deve atribuir responsavel com sucesso', async () => {
      // Arrange
      const processoIds = [1];
      const responsavelId = 10;
      const usuarioExecutouId = 99;

      // Setup chainable Supabase mock that handles:
      // 1. .from('acervo').select('id').in('id', processoIds)
      // 2. .from('usuarios').select('id').eq('id', responsavelId).eq('ativo', true).single()
      // 3. .from('usuarios').select('id').eq('id', usuarioExecutouId).eq('ativo', true).single()
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 1 }],
              error: null,
            }),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 10 },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);

      (buscarAcervoPorId as jest.Mock).mockResolvedValue({ numero_processo: '123' });
      (atribuirResponsavelRepo as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await atribuirResponsavel(processoIds, responsavelId, usuarioExecutouId);

      // Assert
      expect(result.success).toBe(true);
      expect(atribuirResponsavelRepo).toHaveBeenCalledWith(processoIds, responsavelId);
    });
  });
});
