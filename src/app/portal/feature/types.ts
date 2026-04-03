import { ProcessoRespostaIA } from "@/app/(authenticated)/acervo";
import { Contrato } from "@/app/(authenticated)/contratos";
import { Audiencia } from "@/app/(authenticated)/audiencias";
import { AcordoComParcelas } from "@/app/(authenticated)/obrigacoes/types";

// Alias types for usage in Portal Cliente to abstract source
export type ProcessoPortal = ProcessoRespostaIA;
export type ContratoPortal = Contrato;
export type AudienciaPortal = Audiencia;
export type PagamentoPortal = AcordoComParcelas;

export interface DashboardData {
  cliente: { nome: string; cpf: string };
  processos: ProcessoPortal[];
  contratos: ContratoPortal[];
  audiencias: AudienciaPortal[];
  pagamentos: PagamentoPortal[];
  // Track partial errors for better UX
  errors?: {
    processos?: string;
    contratos?: string;
    audiencias?: string;
    pagamentos?: string;
  };
}
