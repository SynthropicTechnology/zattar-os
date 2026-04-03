import {
  AcervoGeralResult,
  ArquivadosResult,
  AudienciasParams,
  BaseCapturaParams,
  CapturaApiResponse,
  CapturaPartesParams,
  CapturaPartesResult,
  CredenciaisApiResponse,
  ListarRecoveryLogsParams,
  ListarRecoveryLogsResponse,
  PendentesParams,
  PendentesResult,
  PericiasParams,
  RecoveryAnaliseResponse,
  ReprocessarParams,
  ReprocessarResponse,
  StartCaptureData,
  TimelineParams,
  TimelineResult,
} from '@/app/(authenticated)/captura/types';

/**
 * Helper para extrair mensagem de erro da resposta da API
 */
function getApiErrorMessage(data: { error?: string | { message?: string } } | null, response: Response): string {
  if (data && typeof data.error === 'object' && data.error !== null) {
    return data.error.message ?? `Erro ${response.status}: ${response.statusText}`;
  }
  return (data && typeof data.error === 'string') ? data.error : `Erro ${response.status}: ${response.statusText}`;
}

/**
 * Cliente API para buscar credenciais disponíveis
 */
export async function listarCredenciais(): Promise<CredenciaisApiResponse> {
  try {
    const response = await fetch('/api/captura/credenciais', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar credenciais',
    };
  }
}

/**
 * Cliente API para captura de acervo geral
 */
export async function capturarAcervoGeral(
  params: BaseCapturaParams
): Promise<CapturaApiResponse<AcervoGeralResult>> {
  try {
    const response = await fetch('/api/captura/trt/acervo-geral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar acervo geral',
    };
  }
}

/**
 * Cliente API para captura de processos arquivados
 */
export async function capturarArquivados(
  params: BaseCapturaParams
): Promise<CapturaApiResponse<ArquivadosResult>> {
  try {
    const response = await fetch('/api/captura/trt/arquivados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar arquivados',
    };
  }
}

/**
 * Cliente API para captura de audiências
 */
export async function capturarAudiencias(
  params: AudienciasParams
): Promise<CapturaApiResponse<StartCaptureData>> {
  try {
    const response = await fetch('/api/captura/trt/audiencias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar audiências',
    };
  }
}

/**
 * Cliente API para captura de perícias
 */
export async function capturarPericias(
  params: PericiasParams
): Promise<CapturaApiResponse<StartCaptureData>> {
  try {
    const response = await fetch('/api/captura/trt/pericias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar perícias',
    };
  }
}

/**
 * Cliente API para captura de pendências de manifestação
 */
export async function capturarPendentes(
  params: PendentesParams
): Promise<CapturaApiResponse<PendentesResult>> {
  try {
    const response = await fetch('/api/captura/trt/pendentes-manifestacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar pendências',
    };
  }
}

/**
 * Cliente API para captura de partes
 */
export async function capturarPartes(
  params: CapturaPartesParams
): Promise<CapturaApiResponse<CapturaPartesResult>> {
  try {
    const response = await fetch('/api/captura/trt/partes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar partes',
    };
  }
}

/**
 * Cliente API para captura de timeline de processo
 */
export async function capturarTimeline(
  params: TimelineParams
): Promise<CapturaApiResponse<TimelineResult>> {
  try {
    const response = await fetch('/api/captura/trt/timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar timeline',
    };
  }
}

/**
 * Cliente API para captura combinada (unificada)
 */
export async function capturarCombinada(
  params: BaseCapturaParams
): Promise<CapturaApiResponse<StartCaptureData>> {
  try {
    const response = await fetch('/api/captura/trt/combinada', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar dados combinados',
    };
  }
}

/**
 * Deletar registro de captura por ID
 */
export async function deletarCapturaLog(id: number): Promise<CapturaApiResponse> {
  try {
    const response = await fetch(`/api/captura/historico/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar captura',
    };
  }
}

/**
 * Buscar registro de captura por ID
 */
export async function buscarCapturaLog(id: number): Promise<CapturaApiResponse> {
  try {
    const response = await fetch(`/api/captura/historico/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar captura',
    };
  }
}

/**
 * Listar logs de recovery (captura_logs_brutos no Supabase)
 */
export async function listarRecoveryLogs(
  params: ListarRecoveryLogsParams = {}
): Promise<ListarRecoveryLogsResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (params.capturaLogId !== undefined) {
      searchParams.set('captura_log_id', params.capturaLogId.toString());
    }
    if (params.tipoCaptura) {
      searchParams.set('tipo_captura', params.tipoCaptura);
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.trt) {
      searchParams.set('trt', params.trt);
    }
    if (params.grau) {
      searchParams.set('grau', params.grau);
    }
    if (params.advogadoId !== undefined) {
      searchParams.set('advogado_id', params.advogadoId.toString());
    }
    if (params.dataInicio) {
      searchParams.set('data_inicio', params.dataInicio);
    }
    if (params.dataFim) {
      searchParams.set('data_fim', params.dataFim);
    }
    if (params.pagina !== undefined) {
      searchParams.set('pagina', params.pagina.toString());
    }
    if (params.limite !== undefined) {
      searchParams.set('limite', params.limite.toString());
    }
    if (params.incluirEstatisticas) {
      searchParams.set('incluir_estatisticas', 'true');
    }

    const response = await fetch(`/api/captura/recovery?${searchParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar logs de recovery',
    };
  }
}

/**
 * Buscar análise de recovery por raw_log_id (captura_logs_brutos)
 */
export async function buscarRecoveryAnalise(
  mongoId: string,
  options: { analisarGaps?: boolean; incluirPayload?: boolean } = {}
): Promise<RecoveryAnaliseResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (options.analisarGaps !== false) {
      searchParams.set('analisar_gaps', 'true');
    }
    if (options.incluirPayload) {
      searchParams.set('incluir_payload', 'true');
    }

    const response = await fetch(`/api/captura/recovery/${mongoId}?${searchParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar analise de recovery',
    };
  }
}

/**
 * Re-processar elementos de recovery
 */
export async function reprocessarRecovery(
  params: ReprocessarParams
): Promise<ReprocessarResponse> {
  try {
    const response = await fetch('/api/captura/recovery/reprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao re-processar elementos',
    };
  }
}
