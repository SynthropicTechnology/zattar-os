import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { CapturaRawLog, CapturaRawLogCreate, StatusCapturaRaw } from '@/app/(authenticated)/captura/types/captura-raw-log';

export interface RegistrarCapturaRawLogParams
  extends Omit<
    CapturaRawLogCreate,
    'raw_log_id' | 'status' | 'criado_em' | 'atualizado_em'
  > {
  status?: StatusCapturaRaw;
}

/**
 * Sanitiza um objeto para ser persistido em JSONB
 * Remove tipos incompatíveis como BigInt, funções, símbolos
 * Converte BigInt para number ou string
 */
function sanitizarParaJSONB<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // BigInt -> string (para não perder precisão)
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }

  // Função ou Symbol -> undefined (será removido)
  if (typeof obj === 'function' || typeof obj === 'symbol') {
    return undefined as unknown as T;
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizarParaJSONB(item)) as unknown as T;
  }

  // Objeto simples
  if (typeof obj === 'object') {
    // Date, Buffer, ObjectId - manter como está
    if (obj instanceof Date || Buffer.isBuffer(obj)) {
      return obj;
    }

    const resultado: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const valorSanitizado = sanitizarParaJSONB(value);
      if (valorSanitizado !== undefined) {
        resultado[key] = valorSanitizado;
      }
    }
    return resultado as T;
  }

  return obj;
}

/**
 * Persiste o JSON bruto e metadados da captura no PostgreSQL (tabela public.captura_logs_brutos)
 * @param params Parâmetros para criar o documento
 * @returns Objeto com sucesso, raw_log_id e erro opcional
 */
export async function registrarCapturaRawLog(
  params: RegistrarCapturaRawLogParams
): Promise<{ success: boolean; rawLogId: string | null; erro?: string }> {
  try {
    // Validações antes de inserir
    if (params.captura_log_id !== -1 && params.captura_log_id <= 0) {
      const erro = `captura_log_id inválido: ${params.captura_log_id}. Deve ser > 0 ou -1 para erros especiais.`;
      console.error(`❌ [CapturaRawLog] ${erro}`);
      return { success: false, rawLogId: null, erro };
    }

    // Validar campos obrigatórios conforme novos tipos
    if (!params.tipo_captura || !params.advogado_id || !params.credencial_id || !params.trt || !params.grau) {
      const erro = `Campos obrigatórios ausentes: tipo_captura=${params.tipo_captura}, advogado_id=${params.advogado_id}, credencial_id=${params.credencial_id}, trt=${params.trt}, grau=${params.grau}`;
      console.error(`❌ [CapturaRawLog] ${erro}`);
      return { success: false, rawLogId: null, erro };
    }

    // Logar warning se payload_bruto é null mas status é 'success' (inconsistência)
    if (params.payload_bruto === null && params.status === 'success') {
      console.warn(`⚠️ [CapturaRawLog] Inconsistência: payload_bruto é null mas status é 'success' para captura_log_id=${params.captura_log_id}`);
    }

    const supabase = createServiceClient();
    const rawLogId = randomUUID();

    // Sanitizar campos que podem conter tipos incompatíveis com JSONB (BigInt, funções, etc.)
    const registro: CapturaRawLogCreate = {
      raw_log_id: rawLogId,
      captura_log_id: params.captura_log_id,
      tipo_captura: params.tipo_captura,
      advogado_id: params.advogado_id,
      credencial_id: params.credencial_id,
      credencial_ids: params.credencial_ids,
      trt: params.trt,
      grau: params.grau,
      status: params.status || 'success',
      requisicao: sanitizarParaJSONB(params.requisicao),
      payload_bruto: sanitizarParaJSONB(params.payload_bruto),
      resultado_processado: sanitizarParaJSONB(params.resultado_processado),
      logs: params.logs,
      erro: params.erro,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    const { error } = await supabase.from('captura_logs_brutos').insert(registro);
    if (error) {
      throw new Error(error.message);
    }

    return { success: true, rawLogId };
  } catch (error) {
    // Logar contexto completo
    const contexto = {
      captura_log_id: params.captura_log_id,
      tipo_captura: params.tipo_captura,
      trt: params.trt,
      grau: params.grau,
      processo_id: params.requisicao?.processo_id || 'N/A',
    };
    console.error(`❌ [CapturaRawLog] Erro ao persistir log bruto da captura:`, contexto, error);
    return { success: false, rawLogId: null, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Busca todos os logs brutos de uma captura específica
 * @param capturaLogId ID do log de captura no PostgreSQL
 * @returns Array de registros CapturaRawLog
 */
export async function buscarLogsBrutoPorCapturaId(capturaLogId: number): Promise<CapturaRawLog[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('captura_logs_brutos')
      .select('*')
      .eq('captura_log_id', capturaLogId)
      .order('criado_em', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CapturaRawLog[];
  } catch (error) {
    console.error(`❌ [CapturaRawLog] Erro ao buscar logs brutos para captura_log_id=${capturaLogId}:`, error);
    return [];
  }
}

/**
 * Conta logs brutos por status para uma captura específica
 * @param capturaLogId ID do log de captura no PostgreSQL
 * @returns Contadores de status
 */
export async function contarLogsBrutoPorStatus(capturaLogId: number): Promise<{ success: number; error: number; total: number }> {
  try {
    const supabase = createServiceClient();

    const [{ count: total, error: totalErr }, { count: success, error: succErr }, { count: errorCount, error: errErr }] =
      await Promise.all([
        supabase
          .from('captura_logs_brutos')
          .select('*', { count: 'exact', head: true })
          .eq('captura_log_id', capturaLogId),
        supabase
          .from('captura_logs_brutos')
          .select('*', { count: 'exact', head: true })
          .eq('captura_log_id', capturaLogId)
          .eq('status', 'success'),
        supabase
          .from('captura_logs_brutos')
          .select('*', { count: 'exact', head: true })
          .eq('captura_log_id', capturaLogId)
          .eq('status', 'error'),
      ]);

    if (totalErr || succErr || errErr) {
      throw new Error((totalErr || succErr || errErr)?.message || 'Erro ao contar logs brutos');
    }

    return {
      success: success ?? 0,
      error: errorCount ?? 0,
      total: total ?? 0,
    };
  } catch (error) {
    console.error(`❌ [CapturaRawLog] Erro ao contar logs brutos para captura_log_id=${capturaLogId}:`, error);
    return { success: 0, error: 0, total: 0 };
  }
}