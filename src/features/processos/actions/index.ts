"use server";

/**
 * Server Actions para o modulo de Processos
 *
 * Camada de adaptacao entre UI e Core, implementando:
 * - Conversao de FormData para objetos tipados
 * - Validacao com Zod schemas do domain
 * - Chamadas aos servicos do core
 * - Revalidacao de cache via revalidatePath
 * - Verificacao de autenticacao manual (fix de seguranca)
 */

import { revalidatePath } from "next/cache";
import { todayDateString } from "@/lib/date-utils";
import { authenticateRequest } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateProcessoInput,
  type UpdateProcessoInput,
  type ListarProcessosParams,
  type OrigemAcervo,
  type GrauProcesso,
  createProcessoSchema,
  updateProcessoSchema,
  createProcessoManualSchema,
} from "../domain";
import {
  criarProcesso,
  atualizarProcesso,
  listarProcessos,
  buscarProcesso,
  buscarTimeline,
  buscarUsuariosRelacionados,
} from "../service";

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converte erros do Zod para formato de errors por campo
 */
function formatZodErrors(zodError: {
  errors: Array<{ path: (string | number)[]; message: string }>;
}): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join(".");
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

/**
 * Converte FormData para objeto de criacao de Processo
 */
function formDataToCreateProcessoInput(
  formData: FormData
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos numericos obrigatorios
  const idPjeStr = formData.get("idPje")?.toString();
  if (idPjeStr) {
    const idPje = parseInt(idPjeStr, 10);
    if (!isNaN(idPje)) data.idPje = idPje;
  }

  const advogadoIdStr = formData.get("advogadoId")?.toString();
  if (advogadoIdStr) {
    const advogadoId = parseInt(advogadoIdStr, 10);
    if (!isNaN(advogadoId)) data.advogadoId = advogadoId;
  }

  const numeroStr = formData.get("numero")?.toString();
  if (numeroStr) {
    const numero = parseInt(numeroStr, 10);
    if (!isNaN(numero)) data.numero = numero;
  }

  // Campos string obrigatorios
  const origem = formData.get("origem") as OrigemAcervo | null;
  if (origem) data.origem = origem;

  const trt = formData.get("trt")?.toString();
  if (trt) data.trt = trt;

  const grau = formData.get("grau") as GrauProcesso | null;
  if (grau) data.grau = grau;

  const numeroProcesso = formData.get("numeroProcesso")?.toString();
  if (numeroProcesso) data.numeroProcesso = numeroProcesso;

  const descricaoOrgaoJulgador = formData
    .get("descricaoOrgaoJulgador")
    ?.toString();
  if (descricaoOrgaoJulgador)
    data.descricaoOrgaoJulgador = descricaoOrgaoJulgador;

  const classeJudicial = formData.get("classeJudicial")?.toString();
  if (classeJudicial) data.classeJudicial = classeJudicial;

  const codigoStatusProcesso = formData.get("codigoStatusProcesso")?.toString();
  if (codigoStatusProcesso) data.codigoStatusProcesso = codigoStatusProcesso;

  const nomeParteAutora = formData.get("nomeParteAutora")?.toString();
  if (nomeParteAutora) data.nomeParteAutora = nomeParteAutora;

  const nomeParteRe = formData.get("nomeParteRe")?.toString();
  if (nomeParteRe) data.nomeParteRe = nomeParteRe;

  const dataAutuacao = formData.get("dataAutuacao")?.toString();
  if (dataAutuacao) data.dataAutuacao = dataAutuacao;

  // Campos booleanos opcionais
  const segredoJusticaStr = formData.get("segredoJustica")?.toString();
  if (segredoJusticaStr !== undefined && segredoJusticaStr !== null) {
    data.segredoJustica =
      segredoJusticaStr === "true" || segredoJusticaStr === "1";
  }

  const juizoDigitalStr = formData.get("juizoDigital")?.toString();
  if (juizoDigitalStr !== undefined && juizoDigitalStr !== null) {
    data.juizoDigital = juizoDigitalStr === "true" || juizoDigitalStr === "1";
  }

  const temAssociacaoStr = formData.get("temAssociacao")?.toString();
  if (temAssociacaoStr !== undefined && temAssociacaoStr !== null) {
    data.temAssociacao =
      temAssociacaoStr === "true" || temAssociacaoStr === "1";
  }

  // Campos numericos opcionais
  const prioridadeProcessualStr = formData
    .get("prioridadeProcessual")
    ?.toString();
  if (prioridadeProcessualStr) {
    const prioridade = parseInt(prioridadeProcessualStr, 10);
    if (!isNaN(prioridade)) data.prioridadeProcessual = prioridade;
  }

  const qtdeParteAutoraStr = formData.get("qtdeParteAutora")?.toString();
  if (qtdeParteAutoraStr) {
    const qtde = parseInt(qtdeParteAutoraStr, 10);
    if (!isNaN(qtde) && qtde > 0) data.qtdeParteAutora = qtde;
  }

  const qtdeParteReStr = formData.get("qtdeParteRe")?.toString();
  if (qtdeParteReStr) {
    const qtde = parseInt(qtdeParteReStr, 10);
    if (!isNaN(qtde) && qtde > 0) data.qtdeParteRe = qtde;
  }

  // Campos de data opcionais (nullable)
  const dataArquivamento = formData.get("dataArquivamento")?.toString();
  if (dataArquivamento) data.dataArquivamento = dataArquivamento;
  else if (formData.has("dataArquivamento")) data.dataArquivamento = null;

  const dataProximaAudiencia = formData.get("dataProximaAudiencia")?.toString();
  if (dataProximaAudiencia) data.dataProximaAudiencia = dataProximaAudiencia;
  else if (formData.has("dataProximaAudiencia"))
    data.dataProximaAudiencia = null;

  // Responsavel ID (opcional)
  const responsavelIdStr = formData.get("responsavelId")?.toString();
  if (responsavelIdStr) {
    const responsavelId = parseInt(responsavelIdStr, 10);
    if (!isNaN(responsavelId)) data.responsavelId = responsavelId;
  } else if (formData.has("responsavelId")) {
    data.responsavelId = null;
  }

  return data;
}

/**
 * Converte FormData para objeto de atualizacao de Processo
 */
function formDataToUpdateProcessoInput(
  formData: FormData
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos string
  const stringFields = [
    "origem",
    "trt",
    "grau",
    "numeroProcesso",
    "descricaoOrgaoJulgador",
    "classeJudicial",
    "codigoStatusProcesso",
    "nomeParteAutora",
    "nomeParteRe",
    "dataAutuacao",
    "dataArquivamento",
    "dataProximaAudiencia",
  ];

  for (const field of stringFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        data[field] = value.trim();
      } else {
        // Para campos de data, definir como null se vazio
        if (field.startsWith("data") && field !== "dataAutuacao") {
          data[field] = null;
        }
      }
    }
  }

  // Campos numericos
  const numericFields = [
    "idPje",
    "advogadoId",
    "numero",
    "prioridadeProcessual",
    "qtdeParteAutora",
    "qtdeParteRe",
    "responsavelId",
  ];

  for (const field of numericFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) data[field] = num;
      } else if (field === "responsavelId") {
        data[field] = null;
      }
    }
  }

  // Campos booleanos
  const booleanFields = ["segredoJustica", "juizoDigital", "temAssociacao"];

  for (const field of booleanFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      data[field] = value === "true" || value === "1";
    }
  }

  return data;
}

// =============================================================================
// SERVER ACTIONS - PROCESSO
// =============================================================================

/**
 * Action para criar um novo processo
 */
export async function actionCriarProcesso(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    // 1. Converter FormData para objeto
    const rawData = formDataToCreateProcessoInput(formData);

    // 2. Validar com Zod
    const validation = createProcessoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validacao",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados invalidos",
      };
    }

    const client = await createClient();

    // 3. Chamar servico do core
    const result = await criarProcesso(validation.data as CreateProcessoInput, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 4. Revalidar cache
    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Processo criado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar processo. Tente novamente.",
    };
  }
}

/**
 * Action para atualizar um processo existente
 */
export async function actionAtualizarProcesso(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    // 1. Validar ID
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID invalido",
        message: "ID do processo e obrigatorio",
      };
    }

    // 2. Converter FormData para objeto
    const rawData = formDataToUpdateProcessoInput(formData);

    // 3. Validar com Zod
    const validation = updateProcessoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validacao",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados invalidos",
      };
    }

    // 4. Chamar servico do core
    const result = await atualizarProcesso(
      id,
      validation.data as UpdateProcessoInput
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 5. Revalidar cache
    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Processo atualizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar processo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar processo. Tente novamente.",
    };
  }
}

/**
 * Action para listar processos (com suporte a 19 filtros)
 */
export async function actionListarProcessos(
  params?: ListarProcessosParams
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    const client = await createClient();

    const result = await listarProcessos(params, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // Buscar usuarios relacionados
    const usuarios = await buscarUsuariosRelacionados(result.data.data);

    return {
      success: true,
      data: {
        data: result.data.data,
        pagination: result.data.pagination,
        referencedUsers: usuarios,
      },
      message: "Processos carregados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao listar processos:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar processos. Tente novamente.",
    };
  }
}

/**
 * Action para buscar um processo por ID
 */
export async function actionBuscarProcesso(id: number): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID invalido",
        message: "ID do processo e obrigatorio",
      };
    }

    const client = await createClient();

    const result = await buscarProcesso(id, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    if (!result.data) {
      return {
        success: false,
        error: "Processo nao encontrado",
        message: "Processo nao encontrado",
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Processo carregado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar processo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar processo. Tente novamente.",
    };
  }
}

/**
 * Action para buscar timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Sera implementado na Fase 4 (Integracao PJE)
 */
export async function actionBuscarTimeline(
  processoId: number
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "ID invalido",
        message: "ID do processo e obrigatorio",
      };
    }

    const client = await createClient();

    const result = await buscarTimeline(processoId, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Timeline carregada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar timeline:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar timeline. Tente novamente.",
    };
  }
}

// =============================================================================
// ATRIBUIÇÃO DE RESPONSÁVEL EM LOTE
// =============================================================================

/**
 * Action para atribuir responsável a múltiplos processos de uma vez
 */
export async function actionAtribuirResponsavelEmLote(
  processoIds: number[],
  responsavelId: number | null
): Promise<ActionResult<{ atualizados: number; falhas: number }>> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!processoIds.length) {
      return {
        success: false,
        error: "Nenhum processo selecionado",
        message: "Selecione pelo menos um processo",
      };
    }

    let atualizados = 0;
    let falhas = 0;

    const results = await Promise.allSettled(
      processoIds.map((id) =>
        atualizarProcesso(id, { responsavelId } as UpdateProcessoInput)
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        atualizados++;
      } else {
        falhas++;
      }
    }

    revalidatePath("/app/processos");

    if (atualizados === 0) {
      return {
        success: false,
        error: "Falha ao atribuir responsável",
        message: "Nenhum processo foi atualizado",
      };
    }

    return {
      success: true,
      data: { atualizados, falhas },
      message:
        falhas > 0
          ? `${atualizados} processo(s) atualizado(s), ${falhas} falha(s)`
          : `${atualizados} processo(s) atualizado(s) com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao atribuir responsável em lote:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atribuir responsável. Tente novamente.",
    };
  }
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca processos vinculados a um cliente por CPF
 */
export async function actionBuscarProcessosPorCPF(cpf: string, limite?: number): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!cpf || !cpf.trim()) {
      return {
        success: false,
        error: "CPF invalido",
        message: "CPF e obrigatorio",
      };
    }

    const client = await createClient();

    // Import service function dynamically to avoid circular deps
    const { buscarProcessosPorClienteCPF } = await import("../service");
    const result = await buscarProcessosPorClienteCPF(cpf, limite, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} processo(s) encontrado(s)`,
    };
  } catch (error) {
    console.error("Erro ao buscar processos por CPF:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao buscar processos. Tente novamente.",
    };
  }
}

/**
 * Busca processos vinculados a um cliente por CNPJ
 */
export async function actionBuscarProcessosPorCNPJ(cnpj: string, limite?: number): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!cnpj || !cnpj.trim()) {
      return {
        success: false,
        error: "CNPJ invalido",
        message: "CNPJ e obrigatorio",
      };
    }

    const client = await createClient();

    // Import service function dynamically to avoid circular deps
    const { buscarProcessosPorClienteCNPJ } = await import("../service");
    const result = await buscarProcessosPorClienteCNPJ(cnpj, limite, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} processo(s) encontrado(s)`,
    };
  } catch (error) {
    console.error("Erro ao buscar processos por CNPJ:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao buscar processos. Tente novamente.",
    };
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca processo por numero processual (formato CNJ ou simplificado)
 */
export async function actionBuscarProcessoPorNumero(numeroProcesso: string): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    if (!numeroProcesso || !numeroProcesso.trim()) {
      return {
        success: false,
        error: "Numero invalido",
        message: "Numero do processo e obrigatorio",
      };
    }

    // Normalizar número de processo (remover formatação CNJ)
    const { normalizarNumeroProcesso } = await import('../utils');
    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso.trim());

    // NOTE: actionListarProcessos checks auth inside itself, so we can just call it?
    // Wait, calling a Server Action from another Server Action works in Next.js?
    // Yes, but it will trigger another auth check.
    // However, we can call the service directly to avoid double overhead, or just call the action.
    // If we call the action, we rely on its internal check.
    // But `actionListarProcessos` requires `params`.
    // It's cleaner to call `actionListarProcessos` directly if we want to reuse its logic (loading referenced users etc).
    // But `actionListarProcessos` now checks `authenticateRequest` too.
    // Since we are in the same context, `authenticateRequest` should work (cookies are available).

    const result = await actionListarProcessos({ numeroProcesso: numeroNormalizado, limite: 1 });

    if (!result.success) {
      return result;
    }

    if (!result.data) {
      return {
        success: false,
        error: "Dados invalidos",
        message: "Resposta invalida ao buscar processo",
      };
    }

    const resultData = result.data as { data: unknown[]; pagination: unknown; referencedUsers: unknown };
    if (!resultData.data || resultData.data.length === 0) {
      return {
        success: false,
        error: "Processo nao encontrado",
        message: "Nenhum processo encontrado com este numero",
      };
    }

    return {
      success: true,
      data: resultData.data[0],
      message: "Processo encontrado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar processo por numero:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao buscar processo. Tente novamente.",
    };
  }
}

// =============================================================================
// CRIAÇÃO MANUAL DE PROCESSO (sem dados PJE)
// =============================================================================

/**
 * Extrai o número sequencial do CNJ para usar como campo "numero"
 * Formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
 * Retorna os 7 primeiros dígitos como número
 */
function extrairNumeroSequencialCNJ(numeroProcesso: string): number {
  const match = numeroProcesso.match(/^(\d{7})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return Date.now() % 10000000; // Fallback
}

/**
 * Action para criar um processo MANUALMENTE (sem integração PJE)
 *
 * Gera automaticamente:
 * - idPje: timestamp único
 * - advogadoId: 1 (placeholder)
 * - numero: derivado do número CNJ
 * - codigoStatusProcesso: "ATIVO"
 */
/**
 * Busca dados complementares do processo: audiências, expedientes e perícias.
 * Retorna tudo em uma única chamada para eficiência.
 */
export async function actionObterDetalhesComplementaresProcesso(
  processoId: number,
  _numeroProcesso: string
): Promise<
  ActionResult<{
    audiencias: unknown[];
    expedientes: unknown[];
    pericias: unknown[];
  }>
> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    // Buscar audiências, expedientes e perícias em paralelo
    const [audienciasResult, expedientesResult, periciasResult] =
      await Promise.allSettled([
        // Audiências: usar repo direto (findAudienciasByProcessoId)
        import("@/features/audiencias/repository").then((mod) =>
          mod.findAudienciasByProcessoId(processoId)
        ),
        // Expedientes: usar service (listarExpedientes com processoId)
        import("@/features/expedientes/service").then((mod) =>
          mod.listarExpedientes({ processoId, limite: 100 })
        ),
        // Perícias: usar service (listarPericias com processoId)
        import("@/features/pericias/service").then((mod) =>
          mod.listarPericias({ processoId, limite: 100 })
        ),
      ]);

    const audiencias =
      audienciasResult.status === "fulfilled" &&
      audienciasResult.value.success
        ? audienciasResult.value.data
        : [];

    const expedientes =
      expedientesResult.status === "fulfilled" &&
      expedientesResult.value.success
        ? (expedientesResult.value.data as { data: unknown[] }).data
        : [];

    const pericias =
      periciasResult.status === "fulfilled" &&
      periciasResult.value.success
        ? (periciasResult.value.data as { data: unknown[] }).data
        : [];

    return {
      success: true,
      data: { audiencias, expedientes, pericias },
      message: "Dados complementares carregados",
    };
  } catch (error) {
    console.error("Erro ao buscar dados complementares:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar dados complementares.",
    };
  }
}

export async function actionCriarProcessoManual(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Você precisa estar autenticado para realizar esta ação",
      };
    }

    // 1. Extrair dados do FormData
    const rawData: Record<string, unknown> = {};

    // Campos string
    const stringFields = [
      "numeroProcesso",
      "trt",
      "grau",
      "nomeParteAutora",
      "nomeParteRe",
      "classeJudicial",
      "descricaoOrgaoJulgador",
      "dataAutuacao",
      "origem",
    ];

    for (const field of stringFields) {
      const value = formData.get(field)?.toString();
      if (value) {
        rawData[field] = value.trim();
      }
    }

    // Campos numéricos opcionais
    const responsavelIdStr = formData.get("responsavelId")?.toString();
    if (responsavelIdStr) {
      const responsavelId = parseInt(responsavelIdStr, 10);
      if (!isNaN(responsavelId) && responsavelId > 0) {
        rawData.responsavelId = responsavelId;
      }
    }

    // Campos booleanos
    const booleanFields = ["segredoJustica", "juizoDigital", "temAssociacao"];
    for (const field of booleanFields) {
      const value = formData.get(field)?.toString();
      if (value !== undefined && value !== null) {
        rawData[field] = value === "true" || value === "1";
      }
    }

    // 2. Validar com schema manual
    const validation = createProcessoManualSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const dadosValidados = validation.data;

    // 3. Gerar campos automáticos
    const idPje = Date.now(); // Timestamp único como ID PJE simulado
    const advogadoId = 1; // Placeholder - idealmente seria o usuário logado ou configurável
    const numero = extrairNumeroSequencialCNJ(dadosValidados.numeroProcesso);
    const codigoStatusProcesso = "ATIVO";
    const dataAutuacao = dadosValidados.dataAutuacao || todayDateString();

    // 4. Montar input completo para o serviço
    const processoInput: CreateProcessoInput = {
      idPje,
      advogadoId,
      numero,
      codigoStatusProcesso,
      origem: dadosValidados.origem,
      trt: dadosValidados.trt,
      grau: dadosValidados.grau,
      numeroProcesso: dadosValidados.numeroProcesso,
      nomeParteAutora: dadosValidados.nomeParteAutora,
      nomeParteRe: dadosValidados.nomeParteRe,
      classeJudicial: dadosValidados.classeJudicial || "Não informada",
      descricaoOrgaoJulgador: dadosValidados.descricaoOrgaoJulgador || "Não informado",
      dataAutuacao,
      segredoJustica: dadosValidados.segredoJustica,
      juizoDigital: dadosValidados.juizoDigital,
      temAssociacao: dadosValidados.temAssociacao,
      prioridadeProcessual: dadosValidados.prioridadeProcessual,
      qtdeParteAutora: dadosValidados.qtdeParteAutora,
      qtdeParteRe: dadosValidados.qtdeParteRe,
      responsavelId: dadosValidados.responsavelId ?? null,
    };

    const client = await createClient();

    // 5. Chamar serviço do core
    const result = await criarProcesso(processoInput, client);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 6. Revalidar cache
    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Processo criado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar processo manual:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar processo. Tente novamente.",
    };
  }
}
