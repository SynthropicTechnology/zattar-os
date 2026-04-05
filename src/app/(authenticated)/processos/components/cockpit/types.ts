import type { GrauProcesso } from '@/app/(authenticated)/partes';

export type TimelineFilterType =
  | 'todos'
  | 'documentos'
  | 'decisoes'
  | 'recursos'
  | 'citacoes'
  | 'audiencias';

export interface FutureTimelineItem {
  id: string;
  tipo: 'audiencia' | 'expediente' | 'pericia';
  data: string;
  titulo: string;
  subtitulo?: string;
  meta?: Record<string, unknown>;
}

export type ProcessoPhase = 'recurso' | 'sentenca' | 'instrucao' | 'conhecimento';

export const FILTER_TERMS: Record<Exclude<TimelineFilterType, 'todos'>, string[]> = {
  documentos: [],
  decisoes: ['sentença', 'sentenca', 'decisão', 'decisao', 'acórdão', 'acordao', 'julgamento'],
  recursos: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
  citacoes: ['citação', 'citacao', 'intimação', 'intimacao', 'aviso', 'notificação', 'notificacao'],
  audiencias: ['audiência', 'audiencia'],
};

export const PHASE_TERMS: Record<ProcessoPhase, string[]> = {
  recurso: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
  sentenca: ['sentença', 'sentenca', 'acórdão', 'acordao', 'julgamento'],
  instrucao: ['audiência', 'audiencia', 'perícia', 'pericia', 'prova', 'testemunha', 'oitiva', 'inspeção', 'inspecao'],
  conhecimento: ['petição inicial', 'peticao inicial', 'distribuição', 'distribuicao', 'citação', 'citacao'],
};

export const PHASE_CONFIG: Record<ProcessoPhase, { label: string; icon: string }> = {
  recurso: { label: 'Recurso', icon: 'ArrowUpRight' },
  sentenca: { label: 'Sentença', icon: 'Scale' },
  instrucao: { label: 'Instrução', icon: 'Users' },
  conhecimento: { label: 'Conhecimento', icon: 'FileText' },
};
