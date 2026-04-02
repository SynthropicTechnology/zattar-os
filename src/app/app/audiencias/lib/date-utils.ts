/**
 * Utilitários de data/hora usados pela feature de Audiências.
 *
 * Nota: este arquivo existia em `src/lib/date-utils.ts`, mas era usado somente
 * pela feature `audiencias`, então foi movido para manter o microcosmo da feature
 * fechado em si mesmo.
 */

import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIMEZONE = "America/Sao_Paulo";

/**
 * Converte strings de data e hora locais para uma string ISO.
 *
 * IMPORTANTE: Assume que os valores são horário de Brasília (UTC-3).
 * A conversão para ISO UTC é feita explicitamente para evitar problemas
 * quando o servidor está em timezone diferente.
 *
 * @param dateStr - Data no formato 'YYYY-MM-DD'
 * @param timeStr - Hora no formato 'HH:mm'
 */
export function localToISO(dateStr: string, timeStr: string): string {
  // Monta string ISO com timezone de Brasília (UTC-3)
  // Formato: YYYY-MM-DDTHH:mm:00-03:00
  const isoWithTz = `${dateStr}T${timeStr}:00-03:00`;
  return new Date(isoWithTz).toISOString();
}

export function formatDateBR(
  isoStr: string | Date | null | undefined,
  formatStr: string = "dd/MM/yyyy HH:mm"
): string {
  if (!isoStr) return "";

  const date = typeof isoStr === "string" ? parseISO(isoStr) : isoStr;
  if (!isValid(date)) return "";

  return format(date, formatStr, { locale: ptBR });
}

export function isoToDate(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;
  const date = parseISO(isoStr);
  return isValid(date) ? date : null;
}

export function nowBR(): Date {
  return new Date();
}

export function formatForDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

export function formatForTimeInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "HH:mm");
}

export function extractDatePart(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const date = parseISO(isoStr);
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

export function extractTimePart(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const date = parseISO(isoStr);
  if (!isValid(date)) return "";
  return format(date, "HH:mm");
}

export function isValidDateString(str: string | null | undefined): boolean {
  if (!str) return false;
  const date = parseISO(str);
  return isValid(date);
}

export function getTimezone(): string {
  return TIMEZONE;
}


