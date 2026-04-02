/**
 * Briefing Domain — Tipos para a view "Briefing" da Agenda
 * ============================================================================
 * Extensoes do dominio de calendario para suportar:
 * - PrepStatus (status de preparacao de audiencias/eventos)
 * - DaySummary (resumo estatistico do dia)
 * - WeekPulseDay (intensidade diaria da semana)
 * - CalendarView (5 views incluindo briefing)
 * - SOURCE_CONFIG e COLOR_MAP (config visual por fonte/cor)
 * ============================================================================
 */

import type { CalendarSource } from "./domain";

// ─── Prep Status ───────────────────────────────────────────────────────

export type PrepStatus = "preparado" | "parcial" | "pendente";

// ─── Calendar View (extended) ──────────────────────────────────────────

export type CalendarView = "month" | "week" | "day" | "agenda" | "briefing";

// ─── Briefing Event Metadata ───────────────────────────────────────────

/** Metadata enriquecido extraido de UnifiedCalendarEvent.metadata */
export interface BriefingEventMeta {
  processo?: string;
  trt?: string;
  grau?: string;
  modalidade?: "virtual" | "presencial" | "hibrida" | null;
  enderecoPresencial?: { cidade?: string; uf?: string } | null;
  urlAudienciaVirtual?: string | null;
  status?: string;
  prepStatus?: PrepStatus;
  prazoVencido?: boolean;
  parcelaNum?: number;
  valor?: number;
  descricao?: string;
  local?: string;
  responsavelNome?: string;
}

// ─── Day Summary ───────────────────────────────────────────────────────

export interface DaySummary {
  total: number;
  audiencias: number;
  horasOcupado: string;
  horasFoco: string;
  alertas: number;
}

// ─── Week Pulse ────────────────────────────────────────────────────────

export interface WeekPulseDay {
  date: Date;
  dia: string;
  eventos: number;
  horas: number;
  hoje: boolean;
}

// ─── Event Color ───────────────────────────────────────────────────────

export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";

export interface ColorConfig {
  /** Tailwind bg class with opacity for light/dark */
  bg: string;
  /** Solid bg class for dots/indicators */
  bgSolid: string;
  /** Tailwind text class for light/dark */
  text: string;
  /** Tailwind border class */
  border: string;
  /** CSS hsl value for inline styles */
  dot: string;
}

export const COLOR_MAP: Record<EventColor, ColorConfig> = {
  sky:     { bg: "bg-sky-200/50 dark:bg-sky-400/25",       bgSolid: "bg-sky-500",    text: "text-sky-900 dark:text-sky-200",       border: "border-sky-300/40",    dot: "bg-sky-500" },
  amber:   { bg: "bg-amber-200/50 dark:bg-amber-400/25",   bgSolid: "bg-amber-500",  text: "text-amber-900 dark:text-amber-200",   border: "border-amber-300/40",  dot: "bg-amber-500" },
  violet:  { bg: "bg-violet-200/50 dark:bg-violet-400/25", bgSolid: "bg-violet-500", text: "text-violet-900 dark:text-violet-200", border: "border-violet-300/40", dot: "bg-violet-500" },
  rose:    { bg: "bg-rose-200/50 dark:bg-rose-400/25",     bgSolid: "bg-rose-500",   text: "text-rose-900 dark:text-rose-200",     border: "border-rose-300/40",   dot: "bg-rose-500" },
  emerald: { bg: "bg-green-200/50 dark:bg-green-400/25",   bgSolid: "bg-green-500",  text: "text-green-900 dark:text-green-200",   border: "border-green-300/40",  dot: "bg-green-500" },
  orange:  { bg: "bg-orange-200/50 dark:bg-orange-400/25", bgSolid: "bg-orange-500", text: "text-orange-900 dark:text-orange-200", border: "border-orange-300/40", dot: "bg-orange-500" },
};

// ─── Source Config ──────────────────────────────────────────────────────

export interface SourceConfig {
  label: string;
  defaultColor: EventColor;
}

export const SOURCE_CONFIG: Record<CalendarSource, SourceConfig> = {
  agenda:      { label: "Agenda",      defaultColor: "violet" },
  audiencias:  { label: "Audiências",  defaultColor: "sky" },
  expedientes: { label: "Expedientes", defaultColor: "amber" },
  obrigacoes:  { label: "Obrigações",  defaultColor: "amber" },
  pericias:    { label: "Perícias",    defaultColor: "violet" },
};
