/**
 * Serviço de Recuperação de Capturas
 *
 * PROPÓSITO:
 * Fornece funções para listar, buscar e consultar logs de captura
 * armazenados no PostgreSQL (tabela public.captura_logs_brutos) para fins de recuperação e re-persistência.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { CapturaRawLog } from '@/app/(authenticated)/captura/types/captura-raw-log';
import type {
  ListarLogsRecoveryParams,
  ListarLogsRecoveryResult,
  LogRecoverySumario,
} from './types';

// ============================================================================
// Constantes
// ============================================================================

const DEFAULT_LIMITE = 50;
const MAX_LIMITE = 100;

// ============================================================================
// Funções de Listagem
// ============================================================================

/**
 * Lista logs brutos de captura com filtros e paginação
 *
 * @param params - Parâmetros de filtro e paginação
 * @returns Lista paginada de logs (sem payload_bruto para performance)
 */
export async function listarLogsRecovery(
  params: ListarLogsRecoveryParams = {}
): Promise<ListarLogsRecoveryResult> {
  const {
    pagina = 1,
    limite = DEFAULT_LIMITE,
    capturaLogId,
    tipoCaptura,
    status,
    trt,
    grau,
    advogadoId,
    dataInicio,
    dataFim,
  } = params;

  // Validar e ajustar limite
  const limiteAjustado = Math.min(Math.max(1, limite), MAX_LIMITE);
  const paginaAjustada = Math.max(1, pagina);
  const skip = (paginaAjustada - 1) * limiteAjustado;

  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('captura_logs_brutos')
      .select(
        'raw_log_id,captura_log_id,tipo_captura,status,trt,grau,advogado_id,criado_em,erro,requisicao',
        { count: 'exact' }
      );

    if (capturaLogId !== undefined) query = query.eq('captura_log_id', capturaLogId);
    if (tipoCaptura) query = query.eq('tipo_captura', tipoCaptura);
    if (status) query = query.eq('status', status);
    if (trt) query = query.eq('trt', trt);
    if (grau) query = query.eq('grau', grau);
    if (advogadoId !== undefined) query = query.eq('advogado_id', advogadoId);

    if (dataInicio) query = query.gte('criado_em', new Date(dataInicio).toISOString());
    if (dataFim) query = query.lte('criado_em', new Date(dataFim).toISOString());

    query = query.order('criado_em', { ascending: false }).range(skip, skip + limiteAjustado - 1);

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const total = count ?? 0;

    const logs: LogRecoverySumario[] = (data ?? []).map((row) => {
      const requisicao = (row as any).requisicao as Record<string, unknown> | null | undefined;
      return {
        rawLogId: (row as any).raw_log_id as string,
        capturaLogId: (row as any).captura_log_id as number,
        tipoCaptura: (row as any).tipo_captura,
        status: (row as any).status,
        trt: (row as any).trt,
        grau: (row as any).grau,
        advogadoId: (row as any).advogado_id as number,
        criadoEm: new Date((row as any).criado_em as string),
        numeroProcesso: (requisicao?.numero_processo as string | undefined) ?? undefined,
        processoIdPje: (requisicao?.processo_id_pje as number | undefined) ?? undefined,
        erro: ((row as any).erro as string | null | undefined) ?? null,
      };
    });

    const totalPaginas = Math.ceil(total / limiteAjustado);

    return {
      logs,
      total,
      pagina: paginaAjustada,
      limite: limiteAjustado,
      totalPaginas,
    };
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao listar logs:', error);
    throw new Error(
      `Erro ao listar logs de recovery: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// Funções de Busca Individual
// ============================================================================

/**
 * Busca um log bruto pelo raw_log_id
 *
 * @param rawLogId - ID do log bruto (string)
 * @returns Registro completo ou null se não encontrado
 */
export async function buscarLogPorRawLogId(rawLogId: string): Promise<CapturaRawLog | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('captura_logs_brutos')
      .select('*')
      .eq('raw_log_id', rawLogId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as CapturaRawLog | null) ?? null;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao buscar log bruto ${rawLogId}:`, error);
    throw new Error(
      `Erro ao buscar log: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Busca logs de captura por ID do log no PostgreSQL
 *
 * @param capturaLogId - ID do log na tabela capturas_log
 * @returns Array de registros do PostgreSQL (tabela captura_logs_brutos)
 */
export async function buscarLogsPorCapturaLogId(
  capturaLogId: number
): Promise<CapturaRawLog[]> {
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
    console.error(
      `[CapturaRecovery] Erro ao buscar logs para captura_log_id=${capturaLogId}:`,
      error
    );
    throw new Error(
      `Erro ao buscar logs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// Funções de Estatísticas
// ============================================================================

/**
 * Conta logs por status para um período específico
 *
 * @param params - Parâmetros de filtro
 * @returns Contadores por status
 */
export async function contarLogsPorStatus(params: {
  dataInicio?: string;
  dataFim?: string;
  tipoCaptura?: string;
  trt?: string;
}): Promise<{ success: number; error: number; total: number }> {
  try {
    const supabase = createServiceClient();

    const applyFilters = (q: unknown) => {
      let qq = q as any;
      if (params.tipoCaptura) qq = qq.eq('tipo_captura', params.tipoCaptura);
      if (params.trt) qq = qq.eq('trt', params.trt);
      if (params.dataInicio) qq = qq.gte('criado_em', new Date(params.dataInicio).toISOString());
      if (params.dataFim) qq = qq.lte('criado_em', new Date(params.dataFim).toISOString());
      return qq;
    };

    const [{ count: total, error: e1 }, { count: success, error: e2 }, { count: errorCount, error: e3 }] =
      await Promise.all([
        applyFilters(supabase.from('captura_logs_brutos').select('*', { count: 'exact', head: true })),
        applyFilters(
          supabase.from('captura_logs_brutos').select('*', { count: 'exact', head: true }).eq('status', 'success')
        ),
        applyFilters(
          supabase.from('captura_logs_brutos').select('*', { count: 'exact', head: true }).eq('status', 'error')
        ),
      ]);

    if (e1 || e2 || e3) {
      throw new Error((e1 || e2 || e3)?.message || 'Erro ao contar logs');
    }

    return { success: success ?? 0, error: errorCount ?? 0, total: total ?? 0 };
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao contar logs por status:', error);
    return { success: 0, error: 0, total: 0 };
  }
}

/**
 * Obtém estatísticas agregadas por TRT
 *
 * @param params - Parâmetros de filtro
 * @returns Estatísticas por TRT
 */
export async function estatisticasPorTrt(params: {
  dataInicio?: string;
  dataFim?: string;
  tipoCaptura?: string;
}): Promise<
  Array<{
    trt: string;
    total: number;
    success: number;
    error: number;
  }>
> {
  try {
    const supabase = createServiceClient();
    let query: any = supabase.from('captura_logs_brutos').select('trt,status,criado_em');
    if (params.tipoCaptura) query = query.eq('tipo_captura', params.tipoCaptura);
    if (params.dataInicio) query = query.gte('criado_em', new Date(params.dataInicio).toISOString());
    if (params.dataFim) query = query.lte('criado_em', new Date(params.dataFim).toISOString());

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const agg = new Map<string, { trt: string; total: number; success: number; error: number }>();
    for (const row of data ?? []) {
      const trt = (row as any).trt as string | null;
      if (!trt) continue;
      const status = (row as any).status as string | null;
      const cur = agg.get(trt) ?? { trt, total: 0, success: 0, error: 0 };
      cur.total += 1;
      if (status === 'success') cur.success += 1;
      if (status === 'error') cur.error += 1;
      agg.set(trt, cur);
    }

    return Array.from(agg.values()).sort((a, b) => a.trt.localeCompare(b.trt));
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao obter estatísticas por TRT:', error);
    return [];
  }
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Verifica se um log possui payload_bruto disponível para re-processamento
 *
 * @param rawLogId - ID do log bruto
 * @returns true se payload está disponível, false caso contrário
 */
export async function verificarPayloadDisponivel(rawLogId: string): Promise<boolean> {
  try {
    const doc = await buscarLogPorRawLogId(rawLogId);
    return doc?.payload_bruto !== null && doc?.payload_bruto !== undefined;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao verificar payload ${rawLogId}:`, error);
    return false;
  }
}

/**
 * Extrai payload bruto de um log bruto
 *
 * @param rawLogId - ID do log bruto
 * @returns Payload bruto ou null se não disponível
 */
export async function extrairPayloadBruto(
  rawLogId: string
): Promise<unknown | null> {
  try {
    const documento = await buscarLogPorRawLogId(rawLogId);
    return (documento as any)?.payload_bruto ?? null;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao extrair payload ${rawLogId}:`, error);
    return null;
  }
}

