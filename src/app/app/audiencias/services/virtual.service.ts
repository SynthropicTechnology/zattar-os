// Serviço para atualizar URL da audiência virtual

import { createServiceClient } from '@/lib/supabase/service-client';
import { invalidateAudienciasCache } from '@/lib/redis/invalidation';

export interface AtualizarUrlVirtualParams {
  audienciaId: number;
  urlAudienciaVirtual: string | null;
}

/**
 * Atualiza a URL da audiência virtual
 * @param params - Parâmetros contendo ID da audiência e nova URL
 * @returns Audiência atualizada
 * @throws Error se audiência não for encontrada ou houver erro de validação
 */
export async function atualizarUrlVirtualAudiencia(
  params: AtualizarUrlVirtualParams
): Promise<{ id: number; url_audiencia_virtual: string | null }> {
  const { audienciaId, urlAudienciaVirtual } = params;

  // Validar ID
  if (!audienciaId || audienciaId <= 0) {
    throw new Error('ID da audiência inválido');
  }

  // Validar URL se fornecida
  if (urlAudienciaVirtual !== null && urlAudienciaVirtual !== '') {
    try {
      new URL(urlAudienciaVirtual);
    } catch {
      throw new Error('URL inválida');
    }
  }

  const supabase = createServiceClient();

  // Atualizar URL da audiência
  const { data, error } = await supabase
    .from('audiencias')
    .update({
      url_audiencia_virtual: urlAudienciaVirtual || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', audienciaId)
    .select('id, url_audiencia_virtual')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Audiência não encontrada');
    }
    throw new Error(`Erro ao atualizar URL da audiência: ${error.message}`);
  }

  if (!data) {
    throw new Error('Audiência não encontrada');
  }

  // Invalidate cache after successful update
  await invalidateAudienciasCache();

  return data;
}
