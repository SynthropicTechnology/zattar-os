/**
 * Escapa caracteres especiais do PostgREST ILIKE pattern.
 * PostgREST ILIKE uses % and _ as wildcards.
 */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

/**
 * Valida que a coluna de ordenação está na allowlist.
 * Retorna fallback se inválida.
 */
export function validateSortColumn(
  column: string | undefined,
  allowed: readonly string[],
  fallback: string
): string {
  return column && allowed.includes(column) ? column : fallback;
}
