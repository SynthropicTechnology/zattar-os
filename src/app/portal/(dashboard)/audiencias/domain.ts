export type StatusAudienciaPortal = "Agendada" | "Realizada" | "Adiada";

export interface AudienciaPortal {
  id: number;
  processo: string;
  vara: string;
  dataHora: string; // Formatted: "28 Mar 2026, 09:30"
  local: string;
  tipo: string;
  status: StatusAudienciaPortal;
  modalidade: string | null;
  urlVirtual: string | null;
}
