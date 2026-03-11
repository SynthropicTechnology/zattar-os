"use server";

/**
 * CONTRATOS FEATURE - Server Actions
 *
 * Camada de adaptação entre UI e Core, implementando:
 * - Conversão de FormData para objetos tipados
 * - Validação com Zod schemas do domain
 * - Chamadas aos serviços do core
 * - Revalidação de cache via revalidatePath
 */

import { revalidatePath } from "next/cache";
import { atualizarDocumentoNoIndice } from "@/lib/ai/indexing";
import {
  type Contrato,
  type CreateContratoInput,
  type UpdateContratoInput,
  type ListarContratosParams,
  type TipoContrato,
  type TipoCobranca,
  type StatusContrato,
  type PapelContratual,
  type TipoEntidadeContrato,
  createContratoSchema,
  updateContratoSchema,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from "../domain";
import {
  criarContrato,
  atualizarContrato,
  listarContratos,
  buscarContrato,
  contarContratosPorStatus,
  contarContratos,
  contarContratosAteData,
  contarContratosEntreDatas,
  excluirContrato,
} from "../service";

import { createDbClient } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabase/service-client";

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

type LookupNome = { id: number; nome: string };

/**
 * Resolve nomes (id -> nome) para entidades usadas na tabela de contratos.
 *
 * Isso evita fallback visual "Cliente #123" quando o mapa de opções não inclui aquele ID
 * (ex.: carregamento parcial / paginação).
 */
export async function actionResolverNomesEntidadesContrato(input: {
  clienteIds?: number[];
  partesContrariasIds?: number[];
  usuariosIds?: number[];
}): Promise<
  ActionResult<{
    clientes: LookupNome[];
    partesContrarias: LookupNome[];
    usuarios: LookupNome[];
  }>
> {
  try {
    const db = createDbClient();

    const clienteIds = Array.isArray(input.clienteIds)
      ? input.clienteIds.filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const partesContrariasIds = Array.isArray(input.partesContrariasIds)
      ? input.partesContrariasIds.filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const usuariosIds = Array.isArray(input.usuariosIds)
      ? input.usuariosIds.filter((n) => Number.isFinite(n) && n > 0)
      : [];

    const uniq = (arr: number[]) => Array.from(new Set(arr));

    const [clientesRes, partesRes, usuariosRes] = await Promise.all([
      uniq(clienteIds).length
        ? db.from("clientes").select("id,nome").in("id", uniq(clienteIds))
        : Promise.resolve({ data: [] as unknown[], error: null as unknown }),
      uniq(partesContrariasIds).length
        ? db
            .from("partes_contrarias")
            .select("id,nome")
            .in("id", uniq(partesContrariasIds))
        : Promise.resolve({ data: [] as unknown[], error: null as unknown }),
      // Usuários: hoje a UI já traz 1000 ativos. Mantemos lookup opcional (se a tabela existir).
      uniq(usuariosIds).length
        ? db
            .from("usuarios")
            .select("id,nome_completo,nome_exibicao")
            .in("id", uniq(usuariosIds))
        : Promise.resolve({ data: [] as unknown[], error: null as unknown }),
    ]);

    // Falha em qualquer lookup não deve quebrar a página inteira: devolvemos vazio e logamos no retorno.
    // (os fallbacks visuais continuam funcionando)
    const clientes = Array.isArray(clientesRes.data)
      ? (clientesRes.data as Array<Record<string, unknown>>).map((r) => ({
          id: Number(r.id),
          nome: String(r.nome),
        }))
      : [];
    const partesContrarias = Array.isArray(partesRes.data)
      ? (partesRes.data as Array<Record<string, unknown>>).map((r) => ({
          id: Number(r.id),
          nome: String(r.nome),
        }))
      : [];
    const usuarios = Array.isArray(usuariosRes.data)
      ? (usuariosRes.data as Array<Record<string, unknown>>).map((r) => ({
          id: Number(r.id),
          nome: String(
            (r.nome_exibicao as string | null) ||
              (r.nome_completo as string | null) ||
              `Usuário #${r.id}`,
          ),
        }))
      : [];

    return {
      success: true,
      data: { clientes, partesContrarias, usuarios },
      message: "Nomes resolvidos com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao resolver nomes",
      message: "Falha ao resolver nomes",
    };
  }
}

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

function extractPartes(formData: FormData): Array<{
  tipoEntidade: TipoEntidadeContrato;
  entidadeId: number;
  papelContratual: PapelContratual;
  ordem?: number;
}> {
  const raw = formData.get("partes");
  if (!raw || typeof raw !== "string") return [];

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .map((p) => ({
        tipoEntidade: String(p.tipoEntidade) as TipoEntidadeContrato,
        entidadeId: Number(p.entidadeId),
        papelContratual: String(p.papelContratual) as PapelContratual,
        ordem: p.ordem !== undefined ? Number(p.ordem) : undefined,
      }))
      .filter(
        (p) =>
          (p.tipoEntidade === "cliente" ||
            p.tipoEntidade === "parte_contraria") &&
          Number.isFinite(p.entidadeId) &&
          p.entidadeId > 0 &&
          (p.papelContratual === "autora" || p.papelContratual === "re"),
      );
  } catch {
    return [];
  }
}

/**
 * Converte FormData para objeto de criação de Contrato
 */
function formDataToCreateContratoInput(
  formData: FormData,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos obrigatórios (enums)
  const tipoContrato = formData.get("tipoContrato") as TipoContrato | null;
  if (tipoContrato) data.tipoContrato = tipoContrato;

  const tipoCobranca = formData.get("tipoCobranca") as TipoCobranca | null;
  if (tipoCobranca) data.tipoCobranca = tipoCobranca;

  const papelClienteNoContrato = formData.get(
    "papelClienteNoContrato",
  ) as PapelContratual | null;
  if (papelClienteNoContrato)
    data.papelClienteNoContrato = papelClienteNoContrato;

  // Cliente ID (obrigatório)
  const clienteIdStr = formData.get("clienteId")?.toString();
  if (clienteIdStr) {
    const clienteId = parseInt(clienteIdStr, 10);
    if (!isNaN(clienteId)) data.clienteId = clienteId;
  }

  // Segmento ID (opcional)
  const segmentoIdStr = formData.get("segmentoId")?.toString();
  if (segmentoIdStr) {
    const segmentoId = parseInt(segmentoIdStr, 10);
    if (!isNaN(segmentoId)) data.segmentoId = segmentoId;
  }

  // Partes (modelo relacional)
  data.partes = extractPartes(formData);

  // Status (opcional)
  const status = formData.get("status") as StatusContrato | null;
  if (status) data.status = status;

  const cadastradoEm = formData.get("cadastradoEm")?.toString();
  if (cadastradoEm) data.cadastradoEm = cadastradoEm;

  // Responsável ID (opcional)
  const responsavelIdStr = formData.get("responsavelId")?.toString();
  if (responsavelIdStr) {
    const responsavelId = parseInt(responsavelIdStr, 10);
    if (!isNaN(responsavelId)) data.responsavelId = responsavelId;
  }

  // Observações (opcional)
  const observacoes = formData.get("observacoes")?.toString().trim();
  if (observacoes) data.observacoes = observacoes;
  else if (formData.has("observacoes")) data.observacoes = null;

  return data;
}

/**
 * Converte FormData para objeto de atualização de Contrato
 */
function formDataToUpdateContratoInput(
  formData: FormData,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Apenas incluir campos presentes no FormData
  const fields = [
    "tipoContrato",
    "tipoCobranca",
    "papelClienteNoContrato",
    "status",
    "observacoes",
  ];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        data[field] = value.trim();
      } else {
        data[field] = null;
      }
    }
  }

  if (formData.has("cadastradoEm")) {
    const value = formData.get("cadastradoEm")?.toString();
    if (value) data.cadastradoEm = value.trim();
  }

  // Segmento ID
  if (formData.has("segmentoId")) {
    const value = formData.get("segmentoId")?.toString();
    if (value) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) data.segmentoId = num;
    } else {
      data.segmentoId = null;
    }
  }

  // IDs numéricos
  const numericFields = ["clienteId", "responsavelId"];
  for (const field of numericFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) data[field] = num;
      } else {
        data[field] = null;
      }
    }
  }

  if (formData.has("partes")) {
    data.partes = extractPartes(formData);
  }

  return data;
}

// =============================================================================
// HELPERS - INDEXAÇÃO SEMÂNTICA (RAG/pgvector)
// =============================================================================

/**
 * Constrói texto para indexação semântica de um contrato
 *
 * Formato otimizado para busca semântica com RAG/pgvector.
 * Inclui todos os campos relevantes para queries como:
 * "contrato ajuizamento cliente X", "contratos pró-êxito pendentes"
 */
function getContratoIndexText(contrato: Contrato): string {
  const statusLabel =
    STATUS_CONTRATO_LABELS[contrato.status] || contrato.status;
  const tipoLabel =
    TIPO_CONTRATO_LABELS[contrato.tipoContrato] || contrato.tipoContrato;
  const papelLabel =
    PAPEL_CONTRATUAL_LABELS[contrato.papelClienteNoContrato] ||
    contrato.papelClienteNoContrato;
  const cobrancaLabel =
    TIPO_COBRANCA_LABELS[contrato.tipoCobranca] || contrato.tipoCobranca;

  return `Contrato #${contrato.id}: ${tipoLabel} - Cliente ID ${contrato.clienteId} - Status: ${statusLabel} - Papel do Cliente: ${papelLabel} - Cobrança: ${cobrancaLabel} - Cadastrado em: ${contrato.cadastradoEm} - Observações: ${contrato.observacoes || "N/A"}`;
}

/**
 * Indexa um contrato para busca semântica (async, não bloqueia resposta)
 *
 * @remarks
 * Usa tipo 'outro' pois 'contrato' não está na lista de tipos suportados.
 * Categoria 'contrato' é adicionada aos metadados para identificação.
 */
function enfileirarIndexacaoContrato(contrato: Contrato): void {
  if (process.env.ENABLE_AI_INDEXING === "false") return;

  queueMicrotask(async () => {
    try {
      const supabase = createServiceClient();
      await supabase.from("documentos_pendentes_indexacao").insert({
        tipo: "contrato",
        entity_id: contrato.id,
        texto: getContratoIndexText(contrato),
        metadata: {
          tipo: "outro",
          categoria: "contrato",
          id: contrato.id,
          cliente_id: contrato.clienteId,
        },
      });
      console.log(`[Contratos] Contrato ${contrato.id} adicionado à fila`);
    } catch (error) {
      console.error(`[Contratos] Erro ao enfileirar ${contrato.id}:`, error);
    }
  });
}

/**
 * Atualiza indexação de um contrato (async, não bloqueia resposta)
 */
function atualizarIndexacaoContratoAsync(contrato: Contrato): void {
  queueMicrotask(async () => {
    try {
      await atualizarDocumentoNoIndice({
        texto: getContratoIndexText(contrato),
        metadata: {
          tipo: "outro",
          id: contrato.id,
          categoria: "contrato",
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          papelClienteNoContrato: contrato.papelClienteNoContrato,
          updatedAt: contrato.updatedAt,
        },
      });
      console.log(
        `[Contratos] Indexação do contrato ${contrato.id} atualizada`,
      );
    } catch (error) {
      console.error(
        `[Contratos] Erro ao atualizar indexação do contrato ${contrato.id}:`,
        error,
      );
    }
  });
}

// =============================================================================
// SERVER ACTIONS - CONTRATO
// =============================================================================

/**
 * Action para criar um novo contrato
 *
 * @param prevState - Estado anterior da action (para useFormState)
 * @param formData - Dados do formulário
 * @returns ActionResult com o contrato criado ou erro
 *
 * @example
 * ```typescript
 * const [state, formAction] = useFormState(actionCriarContrato, null);
 * ```
 */
export async function actionCriarContrato(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // 1. Converter FormData para objeto
    const rawData = formDataToCreateContratoInput(formData);

    // 2. Validar com Zod
    const validation = createContratoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    // 3. Chamar serviço do core
    const result = await criarContrato(validation.data as CreateContratoInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 4. Revalidar cache
    revalidatePath("/app/contratos");
    revalidatePath("/app/financeiro");

    // 5. Enfileirar indexação semântica (async, não bloqueia resposta)
    enfileirarIndexacaoContrato(result.data);

    return {
      success: true,
      data: result.data,
      message: "Contrato criado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar contrato. Tente novamente.",
    };
  }
}

/**
 * Action para atualizar um contrato existente
 *
 * @param id - ID do contrato a ser atualizado
 * @param prevState - Estado anterior da action (para useFormState)
 * @param formData - Dados do formulário
 * @returns ActionResult com o contrato atualizado ou erro
 *
 * @example
 * ```typescript
 * const boundAction = actionAtualizarContrato.bind(null, contratoId);
 * const [state, formAction] = useFormState(boundAction, null);
 * ```
 */
export async function actionAtualizarContrato(
  id: number,
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // 1. Validar ID
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do contrato é obrigatório",
      };
    }

    // 2. Converter FormData para objeto
    const rawData = formDataToUpdateContratoInput(formData);

    // 3. Validar com Zod
    const validation = updateContratoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    // 4. Chamar serviço do core
    const result = await atualizarContrato(
      id,
      validation.data as UpdateContratoInput,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 5. Revalidar cache
    revalidatePath("/app/contratos");
    revalidatePath(`/app/contratos/${id}`);
    revalidatePath("/app/financeiro");

    // 6. Atualizar indexação semântica (async, não bloqueia resposta)
    atualizarIndexacaoContratoAsync(result.data);

    return {
      success: true,
      data: result.data,
      message: "Contrato atualizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar contrato. Tente novamente.",
    };
  }
}

/**
 * Action para excluir um contrato permanentemente
 */
export async function actionExcluirContrato(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do contrato é obrigatório",
      };
    }

    const result = await excluirContrato(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/contratos");
    revalidatePath("/app/financeiro");

    return {
      success: true,
      data: null,
      message: "Contrato excluído com sucesso",
    };
  } catch (error) {
    console.error("Erro ao excluir contrato:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao excluir contrato. Tente novamente.",
    };
  }
}

// =============================================================================
// SERVER ACTIONS - OPERAÇÕES EM MASSA (BULK)
// =============================================================================

/**
 * Valida uma lista de IDs para operações em massa.
 * Retorna apenas IDs válidos (positivos, finitos, sem duplicatas).
 */
function validarIdsMassa(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(ids.filter((id): id is number => Number.isFinite(id) && id > 0)),
  );
}

/**
 * Altera o status (estágio) de múltiplos contratos de uma vez.
 */
export async function actionAlterarStatusContratosEmMassa(
  ids: number[],
  novoStatus: string,
): Promise<ActionResult<{ atualizados: number }>> {
  try {
    const idsValidos = validarIdsMassa(ids);
    if (idsValidos.length === 0) {
      return { success: false, error: "Nenhum contrato selecionado", message: "Selecione ao menos um contrato" };
    }

    const statusValidos = ["em_contratacao", "contratado", "distribuido", "desistencia"];
    if (!statusValidos.includes(novoStatus)) {
      return { success: false, error: "Status inválido", message: "Status informado não é válido" };
    }

    const db = createDbClient();
    const { error, count } = await db
      .from("contratos")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .in("id", idsValidos);

    if (error) {
      return { success: false, error: error.message, message: "Erro ao alterar status dos contratos" };
    }

    revalidatePath("/app/contratos");
    return {
      success: true,
      data: { atualizados: count ?? idsValidos.length },
      message: `Status alterado para ${STATUS_CONTRATO_LABELS[novoStatus as StatusContrato] ?? novoStatus} em ${count ?? idsValidos.length} contrato(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao alterar status em massa",
    };
  }
}

/**
 * Atribui um responsável a múltiplos contratos de uma vez.
 * Passa `responsavelId = null` para remover responsável.
 */
export async function actionAtribuirResponsavelContratosEmMassa(
  ids: number[],
  responsavelId: number | null,
): Promise<ActionResult<{ atualizados: number }>> {
  try {
    const idsValidos = validarIdsMassa(ids);
    if (idsValidos.length === 0) {
      return { success: false, error: "Nenhum contrato selecionado", message: "Selecione ao menos um contrato" };
    }

    if (responsavelId !== null && (!Number.isFinite(responsavelId) || responsavelId <= 0)) {
      return { success: false, error: "ID do responsável inválido", message: "ID do responsável é inválido" };
    }

    const db = createDbClient();
    const { error, count } = await db
      .from("contratos")
      .update({ responsavel_id: responsavelId, updated_at: new Date().toISOString() })
      .in("id", idsValidos);

    if (error) {
      return { success: false, error: error.message, message: "Erro ao atribuir responsável" };
    }

    revalidatePath("/app/contratos");
    return {
      success: true,
      data: { atualizados: count ?? idsValidos.length },
      message: `Responsável ${responsavelId ? "atribuído" : "removido"} em ${count ?? idsValidos.length} contrato(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atribuir responsável em massa",
    };
  }
}

/**
 * Altera o segmento de múltiplos contratos de uma vez.
 * Passa `segmentoId = null` para remover segmento.
 */
export async function actionAlterarSegmentoContratosEmMassa(
  ids: number[],
  segmentoId: number | null,
): Promise<ActionResult<{ atualizados: number }>> {
  try {
    const idsValidos = validarIdsMassa(ids);
    if (idsValidos.length === 0) {
      return { success: false, error: "Nenhum contrato selecionado", message: "Selecione ao menos um contrato" };
    }

    if (segmentoId !== null && (!Number.isFinite(segmentoId) || segmentoId <= 0)) {
      return { success: false, error: "ID do segmento inválido", message: "ID do segmento é inválido" };
    }

    const db = createDbClient();
    const { error, count } = await db
      .from("contratos")
      .update({ segmento_id: segmentoId, updated_at: new Date().toISOString() })
      .in("id", idsValidos);

    if (error) {
      return { success: false, error: error.message, message: "Erro ao alterar segmento" };
    }

    revalidatePath("/app/contratos");
    return {
      success: true,
      data: { atualizados: count ?? idsValidos.length },
      message: `Segmento ${segmentoId ? "alterado" : "removido"} em ${count ?? idsValidos.length} contrato(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao alterar segmento em massa",
    };
  }
}

/**
 * Exclui múltiplos contratos de uma vez (hard delete).
 */
export async function actionExcluirContratosEmMassa(
  ids: number[],
): Promise<ActionResult<{ excluidos: number }>> {
  try {
    const idsValidos = validarIdsMassa(ids);
    if (idsValidos.length === 0) {
      return { success: false, error: "Nenhum contrato selecionado", message: "Selecione ao menos um contrato" };
    }

    const db = createDbClient();
    const { error, count } = await db
      .from("contratos")
      .delete()
      .in("id", idsValidos);

    if (error) {
      return { success: false, error: error.message, message: "Erro ao excluir contratos" };
    }

    revalidatePath("/app/contratos");
    revalidatePath("/app/financeiro");
    return {
      success: true,
      data: { excluidos: count ?? idsValidos.length },
      message: `${count ?? idsValidos.length} contrato(s) excluído(s) com sucesso`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao excluir contratos em massa",
    };
  }
}

/**
 * Atualiza o responsável de um único contrato (para edição inline na tabela).
 */
export async function actionAlterarResponsavelContrato(
  contratoId: number,
  responsavelId: number | null,
): Promise<ActionResult> {
  try {
    if (!contratoId || contratoId <= 0) {
      return { success: false, error: "ID inválido", message: "ID do contrato é obrigatório" };
    }

    const db = createDbClient();
    const { error } = await db
      .from("contratos")
      .update({ responsavel_id: responsavelId, updated_at: new Date().toISOString() })
      .eq("id", contratoId);

    if (error) {
      return { success: false, error: error.message, message: "Erro ao alterar responsável" };
    }

    revalidatePath("/app/contratos");
    return {
      success: true,
      data: null,
      message: "Responsável alterado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao alterar responsável",
    };
  }
}

/**
 * Action para listar contratos (refresh manual)
 *
 * @param params - Parâmetros de listagem (paginação, filtros, ordenação)
 * @returns ActionResult com lista paginada de contratos ou erro
 *
 * @example
 * ```typescript
 * const result = await actionListarContratos({ pagina: 1, limite: 10, status: 'contratado' });
 * ```
 */
export async function actionListarContratos(
  params?: ListarContratosParams,
): Promise<ActionResult> {
  try {
    const result = await listarContratos(params);

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
      message: "Contratos carregados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao listar contratos:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar contratos. Tente novamente.",
    };
  }
}

/**
 * Action para buscar um contrato por ID
 *
 * @param id - ID do contrato
 * @returns ActionResult com o contrato ou erro
 *
 * @example
 * ```typescript
 * const result = await actionBuscarContrato(123);
 * if (result.success) {
 *   console.log(result.data); // Contrato
 * }
 * ```
 */
export async function actionBuscarContrato(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do contrato é obrigatório",
      };
    }

    const result = await buscarContrato(id);

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
        error: "Contrato não encontrado",
        message: "Contrato não encontrado",
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Contrato carregado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar contrato. Tente novamente.",
    };
  }
}

/**
 * Action para contar contratos agrupados por status
 *
 * @returns ActionResult com objeto contendo contagem por status
 *
 * @example
 * ```typescript
 * const result = await actionContarContratosPorStatus();
 * if (result.success) {
 *   console.log(result.data); // { em_contratacao: 10, contratado: 5, ... }
 * }
 * ```
 */
type DashboardDateFilterInput =
  | { mode: "all" }
  | { mode: "range"; from: string; to: string };

function normalizeRangeFromInput(input: {
  from: string;
  to: string;
}): { from: Date; to: Date } | null {
  const from = new Date(input.from);
  const to = new Date(input.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  if (from.getTime() > to.getTime()) return null;
  return { from, to };
}

export async function actionContarContratosPorStatus(
  dateFilter?: DashboardDateFilterInput,
): Promise<ActionResult<Record<StatusContrato, number>>> {
  try {
    if (dateFilter?.mode === "range") {
      const range = normalizeRangeFromInput({
        from: dateFilter.from,
        to: dateFilter.to,
      });
      if (!range) {
        return {
          success: false,
          error: "Período inválido",
          message: "Período inválido",
        };
      }

      const result = await contarContratosPorStatus({
        dataInicio: range.from,
        dataFim: range.to,
      });
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
        message: "Contagem de contratos carregada com sucesso",
      };
    }

    const result = await contarContratosPorStatus();

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
      message: "Contagem de contratos carregada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao contar contratos por status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar contagem de contratos. Tente novamente.",
    };
  }
}

/**
 * Conta contratos e calcula variação percentual.
 * - mode=all: compara total atual com total até o fim do mês anterior (comportamento legacy)
 * - mode=range: compara total do range com período anterior de mesma duração
 */
export async function actionContarContratosComEstatisticas(
  dateFilter?: DashboardDateFilterInput,
): Promise<
  | {
      success: true;
      data: {
        total: number;
        variacaoPercentual: number | null;
        comparacaoLabel: string;
      };
    }
  | { success: false; error: string }
> {
  try {
    // Para "Tudo", não faz sentido comparar com período anterior.
    if (dateFilter?.mode === "all") {
      const resultAtual = await contarContratos();
      if (!resultAtual.success)
        return { success: false, error: resultAtual.error.message };
      return {
        success: true,
        data: {
          total: resultAtual.data,
          variacaoPercentual: null,
          comparacaoLabel: "",
        },
      };
    }

    if (dateFilter?.mode === "range") {
      const range = normalizeRangeFromInput({
        from: dateFilter.from,
        to: dateFilter.to,
      });
      if (!range) return { success: false, error: "Período inválido" };

      const atualResult = await contarContratosEntreDatas(range.from, range.to);
      if (!atualResult.success)
        return { success: false, error: atualResult.error.message };

      const durationMs = range.to.getTime() - range.from.getTime();
      const prevTo = new Date(range.from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - durationMs);

      const prevResult = await contarContratosEntreDatas(prevFrom, prevTo);
      if (!prevResult.success) {
        return {
          success: true,
          data: {
            total: atualResult.data,
            variacaoPercentual: null,
            comparacaoLabel: "em relação ao período anterior",
          },
        };
      }

      const totalAtual = atualResult.data;
      const totalPrev = prevResult.data;
      let variacaoPercentual: number | null = null;
      if (totalPrev > 0)
        variacaoPercentual = ((totalAtual - totalPrev) / totalPrev) * 100;
      else if (totalAtual > 0) variacaoPercentual = 100;

      return {
        success: true,
        data: {
          total: totalAtual,
          variacaoPercentual,
          comparacaoLabel: "em relação ao período anterior",
        },
      };
    }

    const resultAtual = await contarContratos();
    if (!resultAtual.success)
      return { success: false, error: resultAtual.error.message };

    const agora = new Date();
    const primeiroDiaMesAtual = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1,
    );
    const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual);
    ultimoDiaMesAnterior.setDate(0);
    ultimoDiaMesAnterior.setHours(23, 59, 59, 999);

    const resultMesAnterior =
      await contarContratosAteData(ultimoDiaMesAnterior);
    if (!resultMesAnterior.success) {
      return {
        success: true,
        data: {
          total: resultAtual.data,
          variacaoPercentual: null,
          comparacaoLabel: "em relação ao mês anterior",
        },
      };
    }

    const totalAtual = resultAtual.data;
    const totalMesAnterior = resultMesAnterior.data;
    let variacaoPercentual: number | null = null;
    if (totalMesAnterior > 0)
      variacaoPercentual =
        ((totalAtual - totalMesAnterior) / totalMesAnterior) * 100;
    else if (totalAtual > 0) variacaoPercentual = 100;

    return {
      success: true,
      data: {
        total: totalAtual,
        variacaoPercentual,
        comparacaoLabel: "em relação ao mês anterior",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// TIPOS PARA CONTRATO COMPLETO (Detalhados)
// =============================================================================

export interface ClienteDetalhado {
  id: number;
  nome: string;
  tipoPessoa: "pf" | "pj";
  cpfCnpj: string | null;
  emails: string[] | null;
  dddCelular: string | null;
  numeroCelular: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    municipio: string | null;
    estadoSigla: string | null;
  } | null;
}

export interface ResponsavelDetalhado {
  id: number;
  nome: string;
}

export interface SegmentoDetalhado {
  id: number;
  nome: string;
}

export interface ContratoCompletoStats {
  totalPartes: number;
  totalProcessos: number;
  totalDocumentos: number;
  totalLancamentos: number;
}

export interface ContratoCompleto {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
}

/**
 * Action para buscar contrato com todos os dados relacionados
 *
 * Ideal para página de detalhes do contrato que precisa de:
 * - Dados completos do contrato
 * - Informações do cliente
 * - Informações do responsável
 * - Informações do segmento
 * - Estatísticas (contadores)
 */
export async function actionBuscarContratoCompleto(
  id: number,
): Promise<ActionResult<ContratoCompleto>> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do contrato é obrigatório",
      };
    }

    const db = createDbClient();

    // Buscar contrato com relações
    const contratoResult = await buscarContrato(id);
    if (!contratoResult.success) {
      return {
        success: false,
        error: contratoResult.error.message,
        message: contratoResult.error.message,
      };
    }

    if (!contratoResult.data) {
      return {
        success: false,
        error: "Contrato não encontrado",
        message: "Contrato não encontrado",
      };
    }

    const contrato = contratoResult.data;

    // Fetch paralelo de dados relacionados
    const [
      clienteRes,
      responsavelRes,
      segmentoRes,
      documentosCountRes,
      lancamentosCountRes,
    ] = await Promise.all([
      // Cliente
      db
        .from("clientes")
        .select(
          "id, nome, tipo_pessoa, cpf, cnpj, emails, ddd_celular, numero_celular, endereco_id",
        )
        .eq("id", contrato.clienteId)
        .single(),

      // Responsável (se existir)
      contrato.responsavelId
        ? db
            .from("usuarios")
            .select("id, nome_completo, nome_exibicao")
            .eq("id", contrato.responsavelId)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // Segmento (se existir)
      contrato.segmentoId
        ? db
            .from("segmentos")
            .select("id, nome")
            .eq("id", contrato.segmentoId)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // Contagem de documentos
      db
        .from("contrato_documentos")
        .select("id", { count: "exact", head: true })
        .eq("contrato_id", id),

      // Contagem de lançamentos financeiros
      db
        .from("lancamentos_financeiros")
        .select("id", { count: "exact", head: true })
        .eq("contrato_id", id),
    ]);

    // Processar cliente
    let cliente: ClienteDetalhado | null = null;
    if (clienteRes.data) {
      const c = clienteRes.data as Record<string, unknown>;

      // Buscar endereço se existir
      let endereco: ClienteDetalhado["endereco"] = null;
      if (c.endereco_id) {
        const { data: enderecoData } = await db
          .from("enderecos")
          .select("logradouro, numero, bairro, municipio, estado_sigla")
          .eq("id", c.endereco_id)
          .single();

        if (enderecoData) {
          const e = enderecoData as Record<string, unknown>;
          endereco = {
            logradouro: e.logradouro as string | null,
            numero: e.numero as string | null,
            bairro: e.bairro as string | null,
            municipio: e.municipio as string | null,
            estadoSigla: e.estado_sigla as string | null,
          };
        }
      }

      cliente = {
        id: c.id as number,
        nome: c.nome as string,
        tipoPessoa: c.tipo_pessoa as "pf" | "pj",
        cpfCnpj: (c.cpf as string | null) || (c.cnpj as string | null),
        emails: c.emails as string[] | null,
        dddCelular: c.ddd_celular as string | null,
        numeroCelular: c.numero_celular as string | null,
        endereco,
      };
    }

    // Processar responsável
    let responsavel: ResponsavelDetalhado | null = null;
    if (responsavelRes.data) {
      const r = responsavelRes.data as Record<string, unknown>;
      responsavel = {
        id: r.id as number,
        nome:
          (r.nome_exibicao as string | null) ||
          (r.nome_completo as string) ||
          `Usuário #${r.id}`,
      };
    }

    // Processar segmento
    let segmento: SegmentoDetalhado | null = null;
    if (segmentoRes.data) {
      const s = segmentoRes.data as Record<string, unknown>;
      segmento = {
        id: s.id as number,
        nome: s.nome as string,
      };
    }

    // Montar estatísticas
    const stats: ContratoCompletoStats = {
      totalPartes: contrato.partes.length,
      totalProcessos: contrato.processos.length,
      totalDocumentos: documentosCountRes.count ?? 0,
      totalLancamentos: lancamentosCountRes.count ?? 0,
    };

    return {
      success: true,
      data: {
        contrato,
        cliente,
        responsavel,
        segmento,
        stats,
      },
      message: "Contrato carregado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar contrato completo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar contrato. Tente novamente.",
    };
  }
}
