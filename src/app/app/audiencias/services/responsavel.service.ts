// Serviço para atribuir responsável a audiências
// Valida existência e permissões antes de atribuir

import { createServiceClient } from '@/lib/supabase/service-client';
import {
  atribuirResponsavelAudiencia as rpcAtribuirResponsavel,
} from '@/lib/supabase/set-user-context';
import { invalidateAudienciasCache } from '@/lib/redis/invalidation';

export interface AtribuirResponsavelAudienciaParams {
  audienciaId: number;
  responsavelId: number | null;
  usuarioExecutouId: number;
}

export interface AtribuirResponsavelAudienciaResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

/**
 * Valida se a audiência existe
 */
async function validarAudienciaExiste(audienciaId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('audiencias')
    .select('id')
    .eq('id', audienciaId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Valida se o responsável existe (se fornecido)
 */
async function validarResponsavelExiste(responsavelId: number | null): Promise<boolean> {
  if (responsavelId === null) {
    return true; // null é válido (desatribuição)
  }

  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', responsavelId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Valida se o usuário que executa a ação existe
 */
async function validarUsuarioExecutouExiste(usuarioId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', usuarioId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Atribui responsável a uma audiência
 * 
 * @param params - Parâmetros da atribuição
 * @returns Resultado da operação
 */
export async function atribuirResponsavelAudiencia(
  params: AtribuirResponsavelAudienciaParams
): Promise<AtribuirResponsavelAudienciaResult> {
  const { audienciaId, responsavelId, usuarioExecutouId } = params;

  try {
    // Validações
    const audienciaExiste = await validarAudienciaExiste(audienciaId);
    if (!audienciaExiste) {
      return {
        success: false,
        data: null,
        error: 'Audiência não encontrada',
      };
    }

    const responsavelExiste = await validarResponsavelExiste(responsavelId);
    if (!responsavelExiste) {
      return {
        success: false,
        data: null,
        error: 'Responsável não encontrado ou inativo',
      };
    }

    const usuarioExiste = await validarUsuarioExecutouExiste(usuarioExecutouId);
    if (!usuarioExiste) {
      return {
        success: false,
        data: null,
        error: 'Usuário não encontrado ou inativo',
      };
    }

    // Executar atribuição via RPC (já define contexto de usuário)
    const supabase = createServiceClient();
    const resultado = await rpcAtribuirResponsavel(
      supabase,
      audienciaId,
      responsavelId,
      usuarioExecutouId
    );

    if (!resultado) {
      return {
        success: false,
        data: null,
        error: 'Erro ao atualizar audiência',
      };
    }

    // Invalidar cache de audiências após atribuição bem-sucedida
    await invalidateAudienciasCache();

    return {
      success: true,
      data: resultado,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
