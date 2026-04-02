/**
 * Tipos para processos vinculados a entidades (clientes, partes contrárias, terceiros)
 */

import { StatusProcesso } from "@/features/processos";
import type { PoloProcessoParte, TipoParteProcesso } from "@/app/app/partes";

/**
 * Processo vinculado a uma entidade (cliente, parte contrária, terceiro).
 * Combina dados do vínculo (processo_partes) com dados enriquecidos do acervo.
 */
export interface ProcessoVinculo {
  // Dados do vínculo (processo_partes)
  id: number;
  processo_id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;

  // Campos enriquecidos do acervo
  status: StatusProcesso;
  data_autuacao: string | null;
  data_arquivamento: string | null;
}
