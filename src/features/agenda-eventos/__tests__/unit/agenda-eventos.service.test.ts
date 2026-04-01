
import {
  listarEventosPorPeriodo,
  criarEvento,
  atualizarEvento,
  deletarEvento,
} from '../../service';
import * as repository from '../../repository';
import { ok, err, appError } from '@/types';
import type { AgendaEvento, CriarAgendaEventoInput, AtualizarAgendaEventoInput } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(),
}));

const mockEvento: AgendaEvento = {
  id: 1,
  titulo: 'Reuniao com cliente',
  descricao: 'Discussao sobre o caso',
  dataInicio: '2024-06-01T10:00:00Z',
  dataFim: '2024-06-01T11:00:00Z',
  diaInteiro: false,
  local: 'Escritorio',
  cor: '#3B82F6',
  responsavelId: 10,
  criadoPor: 1,
  createdAt: '2024-05-01T00:00:00Z',
  updatedAt: '2024-05-01T00:00:00Z',
};

describe('AgendaEventos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // listarEventosPorPeriodo
  // ==========================================================================

  describe('listarEventosPorPeriodo', () => {
    it('deve listar eventos do periodo com sucesso', async () => {
      (repository.findByPeriodo as jest.Mock).mockResolvedValue(ok([mockEvento]));

      const result = await listarEventosPorPeriodo('2024-06-01', '2024-06-30');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].titulo).toBe('Reuniao com cliente');
      }
      expect(repository.findByPeriodo).toHaveBeenCalledWith('2024-06-01', '2024-06-30');
    });

    it('deve retornar lista vazia quando nao ha eventos', async () => {
      (repository.findByPeriodo as jest.Mock).mockResolvedValue(ok([]));

      const result = await listarEventosPorPeriodo('2024-01-01', '2024-01-31');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('deve propagar erro do repositorio', async () => {
      (repository.findByPeriodo as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro de conexao'))
      );

      const result = await listarEventosPorPeriodo('2024-06-01', '2024-06-30');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  // ==========================================================================
  // criarEvento
  // ==========================================================================

  describe('criarEvento', () => {
    const validInput: CriarAgendaEventoInput = {
      titulo: 'Novo evento',
      descricao: 'Descricao do evento',
      dataInicio: '2024-06-15T09:00:00Z',
      dataFim: '2024-06-15T10:00:00Z',
      diaInteiro: false,
      local: 'Sala 1',
      cor: '#EF4444',
      responsavelId: 5,
    };

    it('deve criar evento com sucesso', async () => {
      const created = { ...mockEvento, ...validInput, id: 2 };
      (repository.create as jest.Mock).mockResolvedValue(ok(created));

      const result = await criarEvento(validInput, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titulo).toBe('Novo evento');
      }
      expect(repository.create).toHaveBeenCalledWith(validInput, 1);
    });

    it('deve propagar erro do repositorio ao criar', async () => {
      (repository.create as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao inserir'))
      );

      const result = await criarEvento(validInput, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  // ==========================================================================
  // atualizarEvento
  // ==========================================================================

  describe('atualizarEvento', () => {
    it('deve atualizar evento com sucesso', async () => {
      const input: AtualizarAgendaEventoInput = {
        id: 1,
        titulo: 'Titulo atualizado',
      };
      const updated = { ...mockEvento, titulo: 'Titulo atualizado' };
      (repository.update as jest.Mock).mockResolvedValue(ok(updated));

      const result = await atualizarEvento(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titulo).toBe('Titulo atualizado');
      }
      expect(repository.update).toHaveBeenCalledWith(1, { titulo: 'Titulo atualizado' });
    });

    it('deve propagar erro NOT_FOUND ao atualizar evento inexistente', async () => {
      const input: AtualizarAgendaEventoInput = { id: 999, titulo: 'X' };
      (repository.update as jest.Mock).mockResolvedValue(
        err(appError('NOT_FOUND', 'Evento nao encontrado.'))
      );

      const result = await atualizarEvento(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // deletarEvento
  // ==========================================================================

  describe('deletarEvento', () => {
    it('deve deletar evento com sucesso (soft delete)', async () => {
      (repository.softDelete as jest.Mock).mockResolvedValue(ok(undefined));

      const result = await deletarEvento(1);

      expect(result.success).toBe(true);
      expect(repository.softDelete).toHaveBeenCalledWith(1);
    });

    it('deve propagar erro do repositorio ao deletar', async () => {
      (repository.softDelete as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Falha ao excluir'))
      );

      const result = await deletarEvento(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
