/**
 * Server Actions for Acervo Feature
 * Replaces REST API routes with Next.js Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { todayDateString } from "@/lib/date-utils";
import { authenticateRequest as getCurrentUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/authorization";
import {
  obterAcervoPaginado,
  obterAcervoUnificado,
  buscarProcessoPorId,
  atribuirResponsavel as atribuirResponsavelService,
  buscarProcessosClientePorCpf as buscarProcessosClientePorCpfService,
  recapturarTimelineUnificada,
} from "../service";
import { obterTimelineUnificadaPorId } from "../timeline-unificada";
// buscarAcervoPorId is imported dynamically when needed
import {
  listarAcervoParamsSchema,
  atribuirResponsavelSchema,
  type ListarAcervoParams,
  type ProcessosClienteCpfResponse,
} from "../domain";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

function createErrorResponse(
  error: unknown,
  defaultMessage: string
): ActionResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage,
  };
}

/**
 * Lists acervo in paginado mode (flat array of instances)
 * Returns all process instances separately, no unification
 */
export async function actionListarAcervoPaginado(
  params: Omit<ListarAcervoParams, "unified" | "agrupar_por"> = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    // Validate params
    const validatedParams = listarAcervoParamsSchema.parse(params);

    // Get acervo in paginado mode
    const result = await obterAcervoPaginado({
      ...validatedParams,
      unified: false,
      agrupar_por: undefined,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[actionListarAcervoPaginado] Error:", error);
    return createErrorResponse(error, "Erro ao listar acervo");
  }
}

/**
 * Lists acervo in unified mode (grouped by numero_processo)
 * Groups processes with same numero_processo into ProcessoUnificado[]
 */
export async function actionListarAcervoUnificado(
  params: Omit<ListarAcervoParams, "unified" | "agrupar_por"> = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    // Validate params
    const validatedParams = listarAcervoParamsSchema.parse(params);

    // Get acervo in unified mode
    const result = await obterAcervoUnificado({
      ...validatedParams,
      unified: true,
      agrupar_por: undefined,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[actionListarAcervoUnificado] Error:", error);
    return createErrorResponse(error, "Erro ao listar acervo unificado");
  }
}

/**
 * Searches for a process by ID
 */
export async function actionBuscarProcesso(
  id: number
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    const processo = await buscarProcessoPorId(id);

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    return { success: true, data: processo };
  } catch (error) {
    console.error("[actionBuscarProcesso] Error:", error);
    return createErrorResponse(error, "Erro ao buscar processo");
  }
}

/**
 * Assigns responsible user to processes
 */
export async function actionAtribuirResponsavel(
  processoIds: number[],
  responsavelId: number | null
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, "acervo", "editar");
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para editar acervo" };
    }

    // Validate params
    const validatedParams = atribuirResponsavelSchema.parse({
      processoIds,
      responsavelId,
    });

    // Assign responsible
    const result = await atribuirResponsavelService(
      validatedParams.processoIds,
      validatedParams.responsavelId,
      user.id
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Revalidate acervo pages
    revalidatePath("/app/processos");

    return {
      success: true,
      data: { message: "Responsável atribuído com sucesso" },
    };
  } catch (error) {
    console.error("[actionAtribuirResponsavel] Error:", error);
    return createErrorResponse(error, "Erro ao atribuir responsável");
  }
}

/**
 * Searches for processes by client CPF
 * Used by AI Agent for WhatsApp integration
 */
export async function actionBuscarProcessosClientePorCpf(
  cpf: string
): Promise<ProcessosClienteCpfResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    const result = await buscarProcessosClientePorCpfService(cpf);

    return result;
  } catch (error) {
    console.error("[actionBuscarProcessosClientePorCpf] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar processos por CPF",
    };
  }
}

/**
 * Gets timeline for a process by ID
 * Supports unified mode that aggregates timelines from all process instances
 */
export async function actionObterTimelinePorId(
  id: number,
  unified: boolean = false
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    // Validate ID
    if (!id || isNaN(id)) {
      return { success: false, error: "ID do acervo inválido" };
    }

    // Get processo unificado data (fonte da verdade com graus ativos)
    const { buscarProcessoUnificado } = await import("@/app/(authenticated)/processos");
    const processoResult = await buscarProcessoUnificado(id);

    if (!processoResult.success || !processoResult.data) {
      return {
        success: false,
        error: !processoResult.success
          ? processoResult.error?.message || "Processo não encontrado"
          : "Processo não encontrado",
      };
    }

    const processo = processoResult.data;

    // Get timeline - unified or individual
    let timelineData = null;

    if (unified) {
      // Unified mode: aggregate timelines from all instances
      try {
        const timelineUnificada = await obterTimelineUnificadaPorId(id);
        if (timelineUnificada) {
          timelineData = {
            timeline: timelineUnificada.timeline,
            metadata: timelineUnificada.metadata,
            unified: true,
          };
        }
      } catch (error) {
        console.error(
          "[actionObterTimelinePorId] Erro ao buscar timeline unificada:",
          error
        );
        // Continue without timeline if error
      }
    } else {
      // Individual mode: get only timeline for this instance
      const { buscarAcervoPorId } = await import(
        "@/app/(authenticated)/acervo/repository"
      );
      const acervo = await buscarAcervoPorId(id);

      if (acervo?.timeline_jsonb) {
        try {
          // Ler timeline diretamente do JSONB
          timelineData = {
            timeline: acervo.timeline_jsonb.timeline,
            metadata: acervo.timeline_jsonb.metadata,
            unified: false,
          };
        } catch (error) {
          console.error(
            "[actionObterTimelinePorId] Erro ao processar timeline JSONB:",
            error
          );
          // Continue without timeline if error
        }
      }
    }

    // Return combined data with ProcessoUnificado
    const resultado = {
      processo,
      timeline: timelineData,
    };

    return { success: true, data: resultado };
  } catch (error) {
    console.error("[actionObterTimelinePorId] Error:", error);
    return createErrorResponse(error, "Erro ao obter timeline");
  }
}

/**
 * Exports acervo to CSV
 * Forces paginado mode (unified=false, no grouping) for proper CSV export
 */
export async function actionExportarAcervoCSV(
  params: ListarAcervoParams = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para exportar acervo" };
    }

    // Get all data in paginado mode (no pagination, no unification, no grouping)
    const result = await obterAcervoPaginado({
      ...params,
      limite: 10000,
      unified: false,
      agrupar_por: undefined,
    });

    // Convert to CSV format
    const headers = [
      "Número do Processo",
      "TRT",
      "Grau",
      "Origem",
      "Classe Judicial",
      "Parte Autora",
      "Parte Ré",
      "Órgão Julgador",
      "Data de Autuação",
      "Status",
      "Responsável ID",
    ];

    const rows = result.processos.map((p) => [
      p.numero_processo,
      p.trt,
      p.grau,
      p.origem,
      p.classe_judicial,
      p.nome_parte_autora,
      p.nome_parte_re,
      p.descricao_orgao_julgador,
      p.data_autuacao,
      p.status,
      p.responsavel_id?.toString() ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return {
      success: true,
      data: {
        csv,
        filename: `acervo_${todayDateString()}.csv`,
      },
    };
  } catch (error) {
    console.error("[actionExportarAcervoCSV] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao exportar acervo",
    };
  }
}

/**
 * Triggers recapture of timeline for all instances of a unified process
 */
export async function actionRecapturarTimeline(
  acervoId: number
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Check permission (same as visualize)
    const hasPermission = await checkPermission(
      user.id,
      "acervo",
      "visualizar"
    );
    if (!hasPermission) {
      return { success: false, error: "Sem permissão para visualizar acervo" };
    }

    const result = await recapturarTimelineUnificada(acervoId);

    // Revalidate paths
    revalidatePath(`/app/processos/${acervoId}/timeline`);
    revalidatePath(`/app/processos/${acervoId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("[actionRecapturarTimeline] Error:", error);
    return createErrorResponse(error, "Erro ao recapturar timeline");
  }
}
