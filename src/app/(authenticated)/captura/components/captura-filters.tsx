import type { TipoCaptura, StatusCaptura } from '@/app/(authenticated)/captura/types';

/**
 * Tipos de captura disponíveis para seleção
 */
export const TIPOS_CAPTURA: { value: TipoCaptura; label: string }[] = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'arquivados', label: 'Arquivados' },
  { value: 'audiencias', label: 'Audiências' },
  { value: 'pendentes', label: 'Expedientes' },
  { value: 'partes', label: 'Partes' },
  { value: 'combinada', label: 'Combinada' },
];

/**
 * Status de captura disponíveis para seleção
 */
export const STATUS_CAPTURA: { value: StatusCaptura; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluída' },
  { value: 'failed', label: 'Falhou' },
];

/**
 * Interface para filtros de capturas
 */
export interface CapturasFilters {
  tipo_captura?: TipoCaptura;
  status?: StatusCaptura;
  advogado_id?: number;
}
