/**
 * Utilitários de data timezone-safe.
 *
 * REGRA: Para valores date-only (sem hora), NUNCA usar new Date(string).toISOString().
 * Esse padrão causa shift de +1/-1 dia dependendo do fuso horário.
 *
 * Use estas funções no lugar de:
 * - `new Date().toISOString().split('T')[0]`      → `todayDateString()`
 * - `new Date(str).toISOString().split('T')[0]`   → `toDateString(new Date(str))` ou passe a string direto
 * - `date.toISOString().split('T')[0]`             → `toDateString(date)`
 * - Aritmética de datas com `.setDate()`            → `addDays(dateStr, n)`
 */

/**
 * Retorna a data de hoje no fuso local como string YYYY-MM-DD.
 * Seguro em qualquer timezone — usa componentes locais, não UTC.
 */
export function todayDateString(): string {
  return toDateString(new Date());
}

/**
 * Converte um Date object para string YYYY-MM-DD usando o fuso LOCAL.
 * Use quando precisar extrair apenas a data de um Date object.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adiciona (ou subtrai) dias a uma string YYYY-MM-DD.
 * Retorna uma nova string YYYY-MM-DD.
 *
 * @example
 * addDays('2024-03-01', 7)  // '2024-03-08'
 * addDays('2024-03-01', -1) // '2024-02-29'
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toDateString(date);
}

/**
 * Adiciona (ou subtrai) meses a uma string YYYY-MM-DD.
 * Se o dia resultante exceder o mês, ajusta para o último dia do mês.
 *
 * @example
 * addMonths('2024-01-31', 1) // '2024-02-29'
 * addMonths('2024-03-15', -1) // '2024-02-15'
 */
export function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  // Se o dia mudou, significa que excedeu o mês — ajustar para último dia
  if (date.getDate() !== d) {
    date.setDate(0); // volta para último dia do mês anterior
  }
  return toDateString(date);
}

/**
 * Compara duas strings YYYY-MM-DD.
 * Retorna negativo se a < b, 0 se iguais, positivo se a > b.
 */
export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}
