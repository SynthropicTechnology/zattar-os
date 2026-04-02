/**
 * Utilitários para mapeamento de polos PJE para sistema interno
 *
 * Este módulo contém funções para:
 * - Mapear polos do PJE (ATIVO, PASSIVO, OUTROS) para sistema interno
 * - Validar tipos de parte do processo
 * - Normalizar valores de polo
 */

import type { PoloProcessoParte, TipoParteProcesso } from "@/app/app/partes";
import { TIPOS_PARTE_PROCESSO_VALIDOS } from "@/app/app/partes";
import type { Polo } from "@/app/app/partes/types";

/**
 * Mapeamento de polos PJE para o sistema interno
 * PJE usa: ATIVO, PASSIVO, OUTROS
 * Sistema interno usa: ATIVO, PASSIVO, TERCEIRO
 */
const MAPEAMENTO_POLO: Record<string, PoloProcessoParte> = {
  ATIVO: "ATIVO",
  PASSIVO: "PASSIVO",
  OUTROS: "TERCEIRO",
};

/**
 * Mapeia polo do PJE para o sistema interno
 *
 * @param poloPJE - Polo retornado pelo PJE (ATIVO, PASSIVO, OUTROS)
 * @returns Polo no formato do sistema interno (ATIVO, PASSIVO, TERCEIRO)
 *
 * @example
 * mapearPoloParaSistema("ATIVO") // "ATIVO"
 * mapearPoloParaSistema("OUTROS") // "TERCEIRO"
 */
export function mapearPoloParaSistema(
  poloPJE: "ATIVO" | "PASSIVO" | "OUTROS" | string
): PoloProcessoParte {
  const poloUpper = poloPJE?.toUpperCase() ?? "OUTROS";
  return MAPEAMENTO_POLO[poloUpper] ?? "TERCEIRO";
}

/**
 * Normaliza o valor de polo do PJE para o formato interno (lowercase)
 * PJE pode retornar valores em diferentes formatos (uppercase, lowercase, variações)
 *
 * @param poloStr - String de polo retornada pelo PJE
 * @returns Polo normalizado para lowercase ou null se inválido
 *
 * @example
 * normalizarPolo("ATIVO") // "ativo"
 * normalizarPolo("Passivo") // "passivo"
 * normalizarPolo("terceiro") // "outros"
 * normalizarPolo(null) // null
 */
export function normalizarPolo(poloStr: unknown): Polo | null {
  if (!poloStr || typeof poloStr !== "string") {
    return null;
  }

  const poloNormalizado = poloStr.trim().toLowerCase();

  switch (poloNormalizado) {
    case "ativo":
      return "ativo";
    case "passivo":
      return "passivo";
    case "outros":
    case "outro":
    case "terceiro":
      return "outros";
    default:
      return "outros";
  }
}

/**
 * Valida tipo de parte do PJE contra tipos válidos do sistema
 * Usa TIPOS_PARTE_PROCESSO_VALIDOS como fonte única de verdade
 *
 * @param tipoParte - Tipo de parte retornado pelo PJE
 * @returns Tipo de parte válido ou "OUTRO" se não reconhecido
 *
 * @example
 * validarTipoParteProcesso("RECLAMANTE") // "RECLAMANTE"
 * validarTipoParteProcesso("TIPO_DESCONHECIDO") // "OUTRO"
 */
export function validarTipoParteProcesso(tipoParte: string): TipoParteProcesso {
  // Verifica se o tipo existe nas chaves do objeto Record
  if (tipoParte in TIPOS_PARTE_PROCESSO_VALIDOS) {
    return tipoParte as TipoParteProcesso;
  } else {
    return "OUTRO";
  }
}

/**
 * Verifica se o polo é válido para vinculação de processo
 *
 * @param polo - Polo a ser validado
 * @returns true se polo é válido (ATIVO, PASSIVO ou TERCEIRO)
 */
export function isPoloValido(polo: string): polo is PoloProcessoParte {
  return polo === "ATIVO" || polo === "PASSIVO" || polo === "TERCEIRO";
}

/**
 * Determina o polo baseado no tipo de parte (heurística)
 * Usado como fallback quando polo não está definido
 *
 * @param tipoParte - Tipo de parte do PJE
 * @returns Polo inferido baseado no tipo de parte
 */
export function inferirPoloDoTipoParte(tipoParte: string): PoloProcessoParte {
  const tipoUpper = tipoParte?.toUpperCase() ?? "";

  // Tipos que normalmente são do polo ativo
  const tiposAtivos = [
    "RECLAMANTE",
    "AUTOR",
    "EXEQUENTE",
    "REQUERENTE",
    "IMPETRANTE",
    "EMBARGANTE",
    "AGRAVANTE",
    "APELANTE",
    "RECORRENTE",
  ];

  // Tipos que normalmente são do polo passivo
  const tiposPassivos = [
    "RECLAMADO",
    "REU",
    "RÉU",
    "EXECUTADO",
    "REQUERIDO",
    "IMPETRADO",
    "EMBARGADO",
    "AGRAVADO",
    "APELADO",
    "RECORRIDO",
  ];

  if (tiposAtivos.some((t) => tipoUpper.includes(t))) {
    return "ATIVO";
  }

  if (tiposPassivos.some((t) => tipoUpper.includes(t))) {
    return "PASSIVO";
  }

  return "TERCEIRO";
}
