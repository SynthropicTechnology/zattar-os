/**
 * PROCESSOS UTILS - Utilitários para Processos
 *
 * Funções auxiliares para normalização, formatação e validação de dados de processos.
 */

/**
 * Normaliza um número de processo removendo todos os caracteres não numéricos.
 * 
 * Remove formatação CNJ (pontos, traços, espaços) deixando apenas os dígitos.
 * 
 * @param numeroProcesso - Número do processo (com ou sem formatação CNJ)
 * @returns Número normalizado contendo apenas dígitos
 * 
 * @example
 * ```ts
 * normalizarNumeroProcesso('0000123-45.2024.5.02.0001') // '00001234520245020001'
 * normalizarNumeroProcesso('00001234520245020001') // '00001234520245020001'
 * normalizarNumeroProcesso('0000123-45.2024.5.02.0001 ') // '00001234520245020001'
 * ```
 */
export function normalizarNumeroProcesso(numeroProcesso: string): string {
  if (!numeroProcesso) return '';
  return numeroProcesso.replace(/[^0-9]/g, '');
}

