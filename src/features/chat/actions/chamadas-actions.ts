'use server';

import { revalidatePath } from 'next/cache';
import { createChatService } from '../service';
import { TipoChamada, ActionResult, ListarChamadasParams, PaginatedResponse, ChamadaComParticipantes, DyteMeetingDetails } from '../domain';
import { getCurrentUser } from '../../../lib/auth/server';
import { getMeetingDetails, createMeeting, addParticipant, ensureTranscriptionPreset, startRecording, stopRecording, getRecordingDetails } from '@/lib/dyte/client';

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Inicia uma nova chamada
 */
export async function actionIniciarChamada(
  salaId: number,
  tipo: TipoChamada
): Promise<ActionResult<{ chamadaId: number; meetingId: string; authToken: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();

    // Buscar sala para usar nome
    const salaResult = await service.buscarSala(salaId);
    if (salaResult.isErr()) return { success: false, message: 'Sala não encontrada', error: salaResult.error.message };
    
    const { isDyteTranscriptionEnabled } = await import('@/lib/dyte/config');
    if (await isDyteTranscriptionEnabled()) {
      try {
        await Promise.all([
          ensureTranscriptionPreset('group_call_host'),
          ensureTranscriptionPreset('group_call_participant'),
        ]);
      } catch (error) {
        console.warn('Failed to update Dyte presets for transcription, continuing anyway:', error);
      }
    }
    
    // 1. Criar meeting no Dyte with transcription enabled
    const meetingId = await createMeeting(`Sala ${salaResult.value?.nome} - ${tipo}`);

    // 2. Persistir chamada no banco
    const chamadaResult = await service.iniciarChamada(salaId, tipo, user.id, meetingId);
    if (chamadaResult.isErr()) {
      return { success: false, message: chamadaResult.error.message, error: chamadaResult.error.message };
    }

    // 3. Gerar token para o iniciador
    const authToken = await addParticipant(
      meetingId, 
      user.nomeCompleto || 'Usuário',
      'group_call_host' // Iniciador é host
    );

    revalidatePath(`/app/chat/${salaId}`);
    
    return {
      success: true,
      data: {
        chamadaId: chamadaResult.value.id,
        meetingId,
        authToken,
      },
      message: 'Chamada iniciada com sucesso'
    };

  } catch (error) {
    console.error('Erro actionIniciarChamada:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage, error: errorMessage };
  }
}

/**
 * Responde a um convite de chamada
 */
export async function actionResponderChamada(
  chamadaId: number,
  aceitou: boolean
): Promise<ActionResult<{ meetingId?: string; authToken?: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();

    // Registrar resposta
    const responseResult = await service.responderChamada(chamadaId, user.id, aceitou);
    if (responseResult.isErr()) {
      return { success: false, message: responseResult.error.message, error: responseResult.error.message };
    }

    if (!aceitou) {
      return { success: true, data: {}, message: 'Chamada recusada' };
    }

    // Se aceitou, preparar dados para entrar
    const { createCallsRepository } = await import('../repositories/calls-repository');
    const repo = await createCallsRepository();
    const chamadaResult = await repo.findChamadaById(chamadaId);
    
    if (chamadaResult.isErr() || !chamadaResult.value) {
       return { success: false, message: 'Chamada não encontrada', error: 'Not Found' };
    }
    
    const meetingId = chamadaResult.value.meetingId;

    const authToken = await addParticipant(
      meetingId,
      user.nomeCompleto || 'Usuário',
      'group_call_participant'
    );

    return {
      success: true,
      data: {
        meetingId,
        authToken
      },
      message: 'Chamada aceita'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro actionResponderChamada:', errorMessage, error);
    return { success: false, message: `Erro ao responder chamada: ${errorMessage}`, error: errorMessage };
  }
}

/**
 * Registra entrada na chamada (atualiza status e timestamps)
 */
export async function actionEntrarNaChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.entrarNaChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: undefined, message: 'Entrada registrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao entrar na chamada', error: String(error) };
  }
}

/**
 * Registra saída da chamada
 */
export async function actionSairDaChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.sairDaChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: undefined, message: 'Saída registrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao sair da chamada', error: String(error) };
  }
}

/**
 * Finaliza chamada manualmente
 */
export async function actionFinalizarChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.finalizarChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    // Trigger AI Summary if transcription exists (fire and forget)
    (async () => {
      try {
        await service.gerarResumo(chamadaId);
      } catch (e) {
        console.error("Background summary generation failed:", e);
      }
    })();

    revalidatePath("/app/chat");
    return { success: true, data: undefined, message: 'Chamada finalizada' };
  } catch (error) {
    return { success: false, message: 'Erro ao finalizar chamada', error: String(error) };
  }
}

export async function actionSalvarTranscricao(
  chamadaId: number,
  transcricao: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.salvarTranscricao(chamadaId, transcricao, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }
    
    return { success: true, data: undefined, message: 'Transcrição salva' };
  } catch (error) {
    console.error("Error in actionSalvarTranscricao:", error);
    return { success: false, message: "Erro interno ao salvar transcrição", error: String(error) };
  }
}

export async function actionGerarResumo(
  chamadaId: number
): Promise<ActionResult<string>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.gerarResumo(chamadaId);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    revalidatePath("/app/chat");
    return { success: true, data: result.value, message: 'Resumo gerado com sucesso' };
  } catch (error) {
    console.error("Error in actionGerarResumo:", error);
    return { success: false, message: "Erro interno ao gerar resumo", error: String(error) };
  }
}

/**
 * Busca histórico de chamadas
 */
export async function actionBuscarHistoricoChamadas(
  salaId: number
): Promise<ActionResult<ChamadaComParticipantes[]>> {
  try {
    const service = await createChatService();
    const result = await service.buscarHistoricoChamadas(salaId);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: result.value, message: 'Histórico recuperado' };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar histórico', error: String(error) };
  }
}

/**
 * Lista histórico global de chamadas com filtros
 */
export async function actionListarHistoricoGlobal(
  params: ListarChamadasParams
): Promise<ActionResult<PaginatedResponse<ChamadaComParticipantes>>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    
    // Converter pagina para offset
    const pageNum = params.pagina ? parseInt(String(params.pagina), 10) : 1;
    const limit = params.limite ? parseInt(String(params.limite), 10) : 50;
    const offset = (pageNum - 1) * limit;
    
    const paramsComUser: ListarChamadasParams = { ...params };
    // Remover pagina e adicionar offset
    delete (paramsComUser as { pagina?: number }).pagina;
    paramsComUser.offset = offset;
    paramsComUser.limite = limit;
    
    // Aplicar filtro de usuário apenas se não for admin
    if (!user.roles?.includes('admin')) {
      paramsComUser.usuarioId = user.id;
    }
    // Se for admin, preservar params.usuarioId se fornecido (para filtro específico)

    const result = await service.buscarHistoricoGlobal(paramsComUser);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: result.value, message: 'Histórico recuperado com sucesso' };
  } catch (error) {
    console.error('Erro actionListarHistoricoGlobal:', error);
    return { success: false, message: 'Erro ao listar histórico', error: String(error) };
  }
}

/**
 * Busca detalhes de um meeting no Dyte
 */
export async function actionBuscarDetalhesMeeting(
  meetingId: string
): Promise<ActionResult<DyteMeetingDetails>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const details = await getMeetingDetails(meetingId);
    
    if (!details) {
      return { success: false, message: 'Meeting não encontrado no Dyte', error: 'Not Found' };
    }

    const mappedDetails: DyteMeetingDetails = {
      id: details.id,
      status: details.status,
      participantCount: details.participant_count || 0,
      startedAt: details.started_at,
      endedAt: details.ended_at,
      duration: details.duration,
    };

    return { success: true, data: mappedDetails, message: 'Detalhes recuperados' };
  } catch (error) {
    console.error('Erro actionBuscarDetalhesMeeting:', error);
    return { success: false, message: 'Erro ao buscar detalhes do meeting', error: String(error) };
  }
}

/**
 * Busca uma chamada por ID
 */
export async function actionBuscarChamadaPorId(
  id: number
): Promise<ActionResult<ChamadaComParticipantes | null>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.buscarChamadaPorId(id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: result.value, message: 'Chamada encontrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar chamada', error: String(error) };
  }
}

/**
 * Inicia gravação de uma chamada
 */
export async function actionIniciarGravacao(
  meetingId: string
): Promise<ActionResult<{ recordingId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    // Verificar se gravação está habilitada
    const { isDyteRecordingEnabled } = await import('@/lib/dyte/config');
    if (!(await isDyteRecordingEnabled())) {
      return { success: false, message: 'Gravação não habilitada', error: 'Feature Disabled' };
    }

    // Verificar se o usuário é o iniciador da chamada
    const { createCallsRepository } = await import('../repositories/calls-repository');
    const repo = await createCallsRepository();
    const chamadaResult = await repo.findChamadaByMeetingId(meetingId);
    
    if (chamadaResult.isErr() || !chamadaResult.value) {
      return { success: false, message: 'Chamada não encontrada', error: 'Not Found' };
    }

    const chamada = chamadaResult.value;
    if (chamada.iniciadoPor !== user.id) {
      return { success: false, message: 'Apenas o iniciador da chamada pode gravar', error: 'Forbidden' };
    }

    // Iniciar gravação no Dyte
    const recordingId = await startRecording(meetingId);

    return {
      success: true,
      data: { recordingId },
      message: 'Gravação iniciada com sucesso'
    };
  } catch (error) {
    console.error('Erro actionIniciarGravacao:', error);
    return { success: false, message: 'Erro ao iniciar gravação', error: String(error) };
  }
}

/**
 * Para gravação de uma chamada
 */
export async function actionPararGravacao(
  recordingId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    // Parar gravação no Dyte
    await stopRecording(recordingId);

    return {
      success: true,
      data: undefined,
      message: 'Gravação parada com sucesso'
    };
  } catch (error) {
    console.error('Erro actionPararGravacao:', error);
    return { success: false, message: 'Erro ao parar gravação', error: String(error) };
  }
}

/**
 * Salva URL de gravação no banco após processamento
 */
export async function actionSalvarUrlGravacao(
  chamadaId: number,
  recordingId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    // Buscar detalhes da gravação no Dyte
    const details = await getRecordingDetails(recordingId);
    
    if (!details || details.status !== 'UPLOADED') {
      return { success: false, message: 'Gravação ainda não disponível', error: 'Not Ready' };
    }

    const downloadUrl = details.download_url;

    // Atualizar chamada no banco
    const service = await createChatService();
    const result = await service.salvarUrlGravacao(chamadaId, downloadUrl);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    revalidatePath('/app/chat');
    return { success: true, data: undefined, message: 'URL de gravação salva' };
  } catch (error) {
    console.error('Erro actionSalvarUrlGravacao:', error);
    return { success: false, message: 'Erro ao salvar URL', error: String(error) };
  }
}

/**
 * Busca URL de gravação de uma chamada
 */
export async function actionBuscarUrlGravacao(
  chamadaId: number
): Promise<ActionResult<string | null>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.buscarChamadaPorId(chamadaId);

    if (result.isErr() || !result.value) {
      return { success: false, message: 'Chamada não encontrada', error: 'Not Found' };
    }

    return {
      success: true,
      data: result.value.gravacaoUrl || null,
      message: 'URL recuperada'
    };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar URL', error: String(error) };
  }
}