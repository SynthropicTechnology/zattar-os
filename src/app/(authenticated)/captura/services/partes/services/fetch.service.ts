/**
 * Serviço de busca de partes via API PJE
 *
 * Este serviço é responsável por:
 * - Buscar partes de um processo via Playwright
 * - Validar resposta da API PJE
 * - Retornar payload bruto para auditoria
 */

import type { Page } from "playwright";
import type { PartePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import { obterPartesProcesso } from "@/app/(authenticated)/captura/pje-trt/partes";

/**
 * Resultado da busca de partes no PJE
 */
export interface BuscarPartesPJEResult {
  /** Lista de partes encontradas */
  partes: PartePJE[];
  /** Payload bruto retornado pelo PJE (para auditoria) */
  payloadBruto: unknown;
}

/**
 * Busca partes de um processo via API PJE usando Playwright
 *
 * @param page - Página do Playwright autenticada no PJE
 * @param idPje - ID do processo no PJE
 * @returns Partes encontradas e payload bruto
 *
 * @example
 * const { partes, payloadBruto } = await buscarPartesPJE(page, 12345);
 * console.log(`Encontradas ${partes.length} partes`);
 */
export async function buscarPartesPJE(
  page: Page,
  idPje: number
): Promise<BuscarPartesPJEResult> {
  const { partes, payloadBruto } = await obterPartesProcesso(page, idPje);

  return {
    partes,
    payloadBruto,
  };
}

/**
 * Verifica se a resposta da API PJE é válida
 *
 * @param response - Resposta da API
 * @returns true se resposta é válida
 */
export function isRespostaPJEValida(response: unknown): response is { partes: PartePJE[] } {
  if (!response || typeof response !== "object") {
    return false;
  }

  const obj = response as Record<string, unknown>;

  if (!Array.isArray(obj.partes)) {
    return false;
  }

  return true;
}

/**
 * Extrai informações de erro da resposta PJE
 *
 * @param response - Resposta de erro da API
 * @returns Mensagem de erro formatada
 */
export function extrairErroPJE(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "Resposta inválida da API PJE";
  }

  const obj = response as Record<string, unknown>;

  if (typeof obj.message === "string") {
    return obj.message;
  }

  if (typeof obj.error === "string") {
    return obj.error;
  }

  if (typeof obj.mensagem === "string") {
    return obj.mensagem;
  }

  return "Erro desconhecido na API PJE";
}
