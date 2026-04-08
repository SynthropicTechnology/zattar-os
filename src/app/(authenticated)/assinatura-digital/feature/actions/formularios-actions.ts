'use server';

import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

export async function listarFormulariosAction(filtros?: {
  segmento_id?: number;
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar formulários.' };
    }

    const { listFormularios } = await import('../services/formularios.service');
    const result = await listFormularios(filtros);
    return { success: true, data: result.formularios };
  } catch (error) {
    return handleError(error);
  }
}
