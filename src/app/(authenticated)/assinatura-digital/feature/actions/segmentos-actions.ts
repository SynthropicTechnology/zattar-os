'use server';

import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import { AssinaturaDigitalService } from '../service';
import {
  createSegmentoSchema,
  updateSegmentoSchema,
} from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

export async function listarSegmentosAction(filtros?: {
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmentos = await assinaturaDigitalService.listarSegmentos(filtros);
    return { success: true, data: segmentos };
  } catch (error) {
    return handleError(error);
  }
}

export async function criarSegmentoAction(
  input: z.infer<typeof createSegmentoSchema>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'criar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para criar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmento = await assinaturaDigitalService.criarSegmento(input);
    revalidatePath('/app/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}

export async function atualizarSegmentoAction(
  id: number,
  input: z.infer<typeof updateSegmentoSchema>,
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'editar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para editar segmentos.' };
    }

    const supabase = await createClient();
    const assinaturaDigitalService = new AssinaturaDigitalService(supabase);
    const segmento = await assinaturaDigitalService.atualizarSegmento(id, input);
    revalidatePath('/app/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}
