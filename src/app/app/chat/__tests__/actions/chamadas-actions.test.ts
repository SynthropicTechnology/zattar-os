import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { createChatService } from '../../service';
import * as dyteClient from '@/lib/dyte/client';
import {
  actionIniciarChamada,
  actionResponderChamada,
  actionEntrarNaChamada,
  actionSairDaChamada,
  actionFinalizarChamada,
  actionSalvarTranscricao,
  actionGerarResumo,
  actionBuscarHistoricoChamadas,
  actionListarHistoricoGlobal,
  actionBuscarDetalhesMeeting,
  actionBuscarChamadaPorId,
  actionIniciarGravacao,
  actionPararGravacao,
  actionSalvarUrlGravacao,
  actionBuscarUrlGravacao,
} from '../../actions/chamadas-actions';
import { criarChamadaMock, criarChamadaParticipanteMock } from '../fixtures';
import { TipoChamada } from '../../domain';

// Mocks
jest.mock('@/lib/auth/server');
jest.mock('../../service');
jest.mock('@/lib/dyte/client');
jest.mock('next/cache');

// Mock dynamic imports used in the source
jest.mock('@/lib/dyte/config', () => ({
  isDyteRecordingEnabled: jest.fn().mockResolvedValue(true),
  isDyteTranscriptionEnabled: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../repository', () => ({
  createCallsRepository: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockCreateChatService = createChatService as jest.MockedFunction<typeof createChatService>;
const mockDyteClient = dyteClient as jest.Mocked<typeof dyteClient>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('Chamadas Actions - Unit Tests', () => {
  const mockUser = { id: 1, nomeCompleto: 'Usuário Teste', email_corporativo: 'usuario@test.com' };
  const mockChamada = criarChamadaMock();
  const mockParticipante = criarChamadaParticipanteMock();

  const mockChatService = {
    iniciarChamada: jest.fn(),
    responderChamada: jest.fn(),
    entrarNaChamada: jest.fn(),
    sairDaChamada: jest.fn(),
    finalizarChamada: jest.fn(),
    salvarTranscricao: jest.fn(),
    gerarResumo: jest.fn(),
    buscarHistoricoChamadas: jest.fn(),
    buscarChamadaPorId: jest.fn(),
    buscarSala: jest.fn(),
    salvarUrlGravacao: jest.fn(),
    buscarHistoricoGlobal: jest.fn(),
  };

  const mockCallsRepo = {
    findChamadaById: jest.fn(),
    findChamadaByMeetingId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser as any);
    mockCreateChatService.mockResolvedValue(mockChatService as any);

    // Setup dynamic import mock for calls-repository
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCallsRepository } = require('../../repository');
    (createCallsRepository as jest.Mock).mockResolvedValue(mockCallsRepo);

    // Setup dynamic import mock for dyte config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDyteRecordingEnabled } = require('@/lib/dyte/config');
    (isDyteRecordingEnabled as jest.Mock).mockResolvedValue(true);
  });

  describe('actionIniciarChamada', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionIniciarChamada(1, TipoChamada.Video);

      expect(result.success).toBe(false);
    });

    it('deve iniciar chamada de vídeo com sucesso', async () => {
      mockChatService.buscarSala.mockResolvedValue({ isErr: () => false, value: { nome: 'Sala Teste' } } as any);
      mockDyteClient.createMeeting.mockResolvedValue('meeting-123');
      mockChatService.iniciarChamada.mockResolvedValue({ isErr: () => false, value: mockChamada } as any);
      mockDyteClient.addParticipant.mockResolvedValue('token-xyz');

      const result = await actionIniciarChamada(1, TipoChamada.Video);

      expect(result.success).toBe(true);
      expect(mockDyteClient.createMeeting).toHaveBeenCalled();
      expect(mockChatService.iniciarChamada).toHaveBeenCalled();
      expect(mockDyteClient.addParticipant).toHaveBeenCalledWith('meeting-123', expect.any(String), 'group_call_host');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat/1');
    });

    it('deve retornar erro quando Dyte API falha', async () => {
      mockChatService.buscarSala.mockResolvedValue({ isErr: () => false, value: { nome: 'Sala Teste' } } as any);
      mockDyteClient.createMeeting.mockRejectedValue(new Error('Dyte API Error'));

      const result = await actionIniciarChamada(1, TipoChamada.Video);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dyte API Error');
    });
  });

  describe('actionResponderChamada', () => {
    it('deve responder chamada com aceitação', async () => {
      mockChatService.responderChamada.mockResolvedValue({
        isErr: () => false,
        value: mockParticipante,
      } as any);
      mockCallsRepo.findChamadaById.mockResolvedValue({
        isErr: () => false,
        value: mockChamada,
      } as any);
      mockDyteClient.addParticipant.mockResolvedValue('token-abc');

      const result = await actionResponderChamada(1, true);

      expect(result.success).toBe(true);
      expect(mockChatService.responderChamada).toHaveBeenCalledWith(1, mockUser.id, true);
      expect(mockDyteClient.addParticipant).toHaveBeenCalled();
    });

    it('deve responder chamada com recusa', async () => {
      mockChatService.responderChamada.mockResolvedValue({
        isErr: () => false,
        value: mockParticipante,
      } as any);

      const result = await actionResponderChamada(1, false);

      expect(result.success).toBe(true);
      expect(mockChatService.responderChamada).toHaveBeenCalledWith(1, mockUser.id, false);
      expect(mockDyteClient.addParticipant).not.toHaveBeenCalled();
    });
  });

  describe('actionFinalizarChamada', () => {
    it('deve finalizar chamada com sucesso', async () => {
      mockChatService.finalizarChamada.mockResolvedValue({ isErr: () => false, value: undefined } as any);
      mockChatService.gerarResumo.mockResolvedValue({ isErr: () => false, value: 'Resumo gerado' } as any);

      const result = await actionFinalizarChamada(1);

      expect(result.success).toBe(true);
      expect(mockChatService.finalizarChamada).toHaveBeenCalledWith(1, mockUser.id);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });
  });

  describe('actionIniciarGravacao', () => {
    it('deve retornar erro quando recording está desabilitado', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isDyteRecordingEnabled } = require('@/lib/dyte/config');
      (isDyteRecordingEnabled as jest.Mock).mockResolvedValue(false);

      const result = await actionIniciarGravacao('meeting-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve retornar erro quando não é o iniciador', async () => {
      mockCallsRepo.findChamadaByMeetingId.mockResolvedValue({
        isErr: () => false,
        value: { ...mockChamada, iniciadoPor: 999 },
      } as any);

      const result = await actionIniciarGravacao('meeting-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve iniciar gravação com sucesso', async () => {
      mockCallsRepo.findChamadaByMeetingId.mockResolvedValue({
        isErr: () => false,
        value: mockChamada,
      } as any);
      mockDyteClient.startRecording.mockResolvedValue('recording-id-123' as any);

      const result = await actionIniciarGravacao('meeting-123');

      expect(result.success).toBe(true);
      expect(mockDyteClient.startRecording).toHaveBeenCalledWith('meeting-123');
    });
  });

  describe('actionSalvarUrlGravacao', () => {
    it('deve retornar erro quando gravação não está disponível', async () => {
      mockDyteClient.getRecordingDetails.mockResolvedValue({
        status: 'PROCESSING',
      } as any);

      const result = await actionSalvarUrlGravacao(1, 'recording-123');

      expect(result.success).toBe(false);
    });

    it('deve salvar URL da gravação com sucesso', async () => {
      mockDyteClient.getRecordingDetails.mockResolvedValue({
        status: 'UPLOADED',
        download_url: 'https://dyte.example.com/recording.mp4',
      } as any);
      mockChatService.salvarUrlGravacao.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionSalvarUrlGravacao(1, 'recording-123');

      expect(result.success).toBe(true);
      expect(mockChatService.salvarUrlGravacao).toHaveBeenCalledWith(
        1,
        'https://dyte.example.com/recording.mp4'
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });
  });

  describe('actionListarHistoricoGlobal', () => {
    it('deve listar histórico com paginação', async () => {
      const mockHistorico = { chamadas: [mockChamada], total: 1 };
      mockChatService.buscarHistoricoGlobal.mockResolvedValue({
        isErr: () => false,
        value: mockHistorico,
      } as any);

      const result = await actionListarHistoricoGlobal({ pagina: 2, limite: 10 });

      expect(result.success).toBe(true);
      expect(mockChatService.buscarHistoricoGlobal).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10 })
      );
    });
  });

  describe('actionBuscarDetalhesMeeting', () => {
    it('deve buscar detalhes do meeting', async () => {
      const mockDetails = {
        id: 'meeting-123',
        status: 'LIVE' as const,
        participant_count: 2,
      };
      mockDyteClient.getMeetingDetails.mockResolvedValue(mockDetails as any);

      const result = await actionBuscarDetalhesMeeting('meeting-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: 'meeting-123',
        status: 'LIVE',
      }));
    });

    it('deve retornar erro quando meeting não encontrado', async () => {
      mockDyteClient.getMeetingDetails.mockRejectedValue(new Error('Meeting not found'));

      const result = await actionBuscarDetalhesMeeting('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Meeting not found');
    });
  });

  describe('actionEntrarNaChamada', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionEntrarNaChamada(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve registrar entrada na chamada com sucesso', async () => {
      mockChatService.entrarNaChamada.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionEntrarNaChamada(1);

      expect(result.success).toBe(true);
      expect(mockChatService.entrarNaChamada).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.entrarNaChamada.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Chamada não encontrada' },
      } as any);

      const result = await actionEntrarNaChamada(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chamada não encontrada');
    });
  });

  describe('actionSairDaChamada', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionSairDaChamada(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve registrar saída da chamada com sucesso', async () => {
      mockChatService.sairDaChamada.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionSairDaChamada(1);

      expect(result.success).toBe(true);
      expect(mockChatService.sairDaChamada).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.sairDaChamada.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Participante não encontrado' },
      } as any);

      const result = await actionSairDaChamada(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Participante não encontrado');
    });
  });

  describe('actionSalvarTranscricao', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionSalvarTranscricao(1, 'Transcrição teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve salvar transcrição com sucesso', async () => {
      mockChatService.salvarTranscricao.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionSalvarTranscricao(1, 'Transcrição teste');

      expect(result.success).toBe(true);
      expect(mockChatService.salvarTranscricao).toHaveBeenCalledWith(1, 'Transcrição teste', mockUser.id);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.salvarTranscricao.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Chamada não encontrada' },
      } as any);

      const result = await actionSalvarTranscricao(1, 'Transcrição teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chamada não encontrada');
    });
  });

  describe('actionGerarResumo', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionGerarResumo(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve gerar resumo com sucesso', async () => {
      const mockResumo = 'Resumo da chamada';
      mockChatService.gerarResumo.mockResolvedValue({ isErr: () => false, value: mockResumo } as any);

      const result = await actionGerarResumo(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockResumo);
      expect(mockChatService.gerarResumo).toHaveBeenCalledWith(1);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.gerarResumo.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Transcrição não encontrada' },
      } as any);

      const result = await actionGerarResumo(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transcrição não encontrada');
    });
  });

  describe('actionBuscarHistoricoChamadas', () => {
    it('deve buscar histórico de chamadas com sucesso', async () => {
      const mockHistorico = [mockChamada];
      mockChatService.buscarHistoricoChamadas.mockResolvedValue({
        isErr: () => false,
        value: mockHistorico,
      } as any);

      const result = await actionBuscarHistoricoChamadas(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistorico);
      expect(mockChatService.buscarHistoricoChamadas).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.buscarHistoricoChamadas.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Sala não encontrada' },
      } as any);

      const result = await actionBuscarHistoricoChamadas(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sala não encontrada');
    });
  });

  describe('actionBuscarChamadaPorId', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionBuscarChamadaPorId(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve buscar chamada por ID com sucesso', async () => {
      mockChatService.buscarChamadaPorId.mockResolvedValue({
        isErr: () => false,
        value: mockChamada,
      } as any);

      const result = await actionBuscarChamadaPorId(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChamada);
      expect(mockChatService.buscarChamadaPorId).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.buscarChamadaPorId.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Chamada não encontrada' },
      } as any);

      const result = await actionBuscarChamadaPorId(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chamada não encontrada');
    });
  });

  describe('actionPararGravacao', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionPararGravacao('recording-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve parar gravação com sucesso', async () => {
      mockDyteClient.stopRecording.mockResolvedValue(undefined);

      const result = await actionPararGravacao('recording-123');

      expect(result.success).toBe(true);
      expect(mockDyteClient.stopRecording).toHaveBeenCalledWith('recording-123');
    });

    it('deve retornar erro quando Dyte API falha', async () => {
      mockDyteClient.stopRecording.mockRejectedValue(new Error('Recording not found'));

      const result = await actionPararGravacao('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Recording not found');
    });
  });

  describe('actionBuscarUrlGravacao', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await actionBuscarUrlGravacao(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve buscar URL de gravação com sucesso', async () => {
      const mockChamadaComUrl = { ...mockChamada, gravacaoUrl: 'https://example.com/recording.mp4' };
      mockChatService.buscarChamadaPorId.mockResolvedValue({
        isErr: () => false,
        value: mockChamadaComUrl,
      } as any);

      const result = await actionBuscarUrlGravacao(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe('https://example.com/recording.mp4');
    });

    it('deve retornar null quando gravação não disponível', async () => {
      mockChatService.buscarChamadaPorId.mockResolvedValue({
        isErr: () => false,
        value: mockChamada,
      } as any);

      const result = await actionBuscarUrlGravacao(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('deve retornar erro quando chamada não encontrada', async () => {
      mockChatService.buscarChamadaPorId.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Chamada não encontrada' },
      } as any);

      const result = await actionBuscarUrlGravacao(1);

      expect(result.success).toBe(false);
    });
  });
});
