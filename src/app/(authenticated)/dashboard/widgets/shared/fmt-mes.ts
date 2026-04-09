/**
 * Formata string de mês ISO ("2026-03" ou "2026-03-01") para label curto PT-BR ("mar").
 * Retorna o valor original se não for parseable como data.
 */
export function fmtMes(mesStr: string): string {
  const date = new Date(mesStr + (mesStr.length === 7 ? '-01' : ''));
  if (isNaN(date.getTime())) return mesStr || '—';
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}
