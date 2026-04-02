import { StatusChamada, TipoChamada } from "./domain";
import { Phone, Video, CalendarCheck, CalendarX, Clock, Ban } from "lucide-react";
import type { BadgeVisualVariant } from "@/lib/design-system";

type BadgeVariant = BadgeVisualVariant;

/**
 * Formata a duração em segundos para formato humanizado (HH:MM:SS ou MM:SS)
 */
export function formatarDuracao(segundos: number): string {
  if (!segundos) return "0s";
  
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

/**
 * Retorna a variante do badge baseada no status da chamada
 */
export function getStatusBadgeVariant(status: StatusChamada): BadgeVariant {
  switch (status) {
    case StatusChamada.Iniciada:
      return "default"; // Azul/Padrão
    case StatusChamada.EmAndamento:
      return "default"; // Verde seria ideal, mas default é azul. Usar style custom se precisar.
    case StatusChamada.Finalizada:
      return "secondary"; // Cinza
    case StatusChamada.Cancelada:
    case StatusChamada.Recusada:
      return "destructive"; // Vermelho
    default:
      return "outline";
  }
}

/**
 * Retorna o label amigável do status
 */
export function getStatusLabel(status: StatusChamada): string {
  switch (status) {
    case StatusChamada.Iniciada:
      return "Iniciada";
    case StatusChamada.EmAndamento:
      return "Em Andamento";
    case StatusChamada.Finalizada:
      return "Finalizada";
    case StatusChamada.Cancelada:
      return "Cancelada";
    case StatusChamada.Recusada:
      return "Recusada";
    default:
      return status;
  }
}

/**
 * Retorna o ícone do tipo de chamada
 */
export function getTipoChamadaIcon(tipo: TipoChamada) {
  return tipo === TipoChamada.Video ? Video : Phone;
}

/**
 * Retorna ícone para status
 */
export function getStatusIcon(status: StatusChamada) {
  switch (status) {
    case StatusChamada.Iniciada:
      return Clock;
    case StatusChamada.EmAndamento:
      return Video;
    case StatusChamada.Finalizada:
      return CalendarCheck;
    case StatusChamada.Cancelada:
      return Ban;
    case StatusChamada.Recusada:
      return CalendarX;
    default:
      return Clock;
  }
}
