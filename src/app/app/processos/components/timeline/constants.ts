/**
 * Constantes da timeline: mapeamento de tipos de eventos para ícones e cores.
 *
 * Cada evento processual é identificado por palavras-chave no campo `titulo`
 * e recebe um conjunto de metadados visuais (ícone, badge, cores).
 */

import {
  FileText,
  Mail,
  Scale,
  MessageSquare,
  ArrowUpRight,
  Calendar,
  Activity,
  type LucideIcon,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export interface TimelineItemMeta {
  /** Ícone Lucide para representar o tipo de evento */
  icon: LucideIcon;
  /** Classe CSS de cor do ícone no círculo da timeline */
  colorClass: string;
  /** Rótulo legível para o badge de tipo */
  badgeLabel: string;
  /** Classe de cor de fundo do badge */
  badgeBgClass: string;
  /** Classe de cor de texto do badge */
  badgeTextClass: string;
  /** Classe de cor da borda do badge */
  badgeBorderClass: string;
}

// -----------------------------------------------------------------------------
// Definições de tipo (sem exposição de implementação interna)
// -----------------------------------------------------------------------------

interface TipoDefinicao {
  /** Termos a verificar (case-insensitive) no titulo */
  termos: string[];
  icon: LucideIcon;
  colorClass: string;
  badgeLabel: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
}

const DEFINICOES_TIPO: TipoDefinicao[] = [
  {
    termos: ['petição', 'peticao', 'contestação', 'contestacao', 'réplica', 'replica'],
    icon: FileText,
    colorClass: 'text-slate-600 dark:text-slate-300',
    badgeLabel: 'Petição',
    badgeBgClass: 'bg-slate-100 dark:bg-slate-800',
    badgeTextClass: 'text-slate-600 dark:text-slate-300',
    badgeBorderClass: 'border-slate-200 dark:border-slate-700',
  },
  {
    termos: ['citação', 'citacao', 'intimação', 'intimacao', 'aviso', 'notificação', 'notificacao'],
    icon: Mail,
    colorClass: 'text-sky-600 dark:text-sky-400',
    badgeLabel: 'Citação',
    badgeBgClass: 'bg-sky-50 dark:bg-sky-900/30',
    badgeTextClass: 'text-sky-700 dark:text-sky-400',
    badgeBorderClass: 'border-sky-100 dark:border-sky-800/50',
  },
  {
    termos: ['sentença', 'sentenca', 'decisão', 'decisao', 'acórdão', 'acordao', 'julgamento'],
    icon: Scale,
    colorClass: 'text-green-600 dark:text-green-500',
    badgeLabel: 'Decisão',
    badgeBgClass: 'bg-green-50 dark:bg-green-900/30',
    badgeTextClass: 'text-green-700 dark:text-green-400',
    badgeBorderClass: 'border-green-100 dark:border-green-800/50',
  },
  {
    termos: ['despacho'],
    icon: MessageSquare,
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeLabel: 'Despacho',
    badgeBgClass: 'bg-amber-50 dark:bg-amber-900/30',
    badgeTextClass: 'text-amber-700 dark:text-amber-400',
    badgeBorderClass: 'border-amber-100 dark:border-amber-800/50',
  },
  {
    termos: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
    icon: ArrowUpRight,
    colorClass: 'text-violet-600 dark:text-violet-400',
    badgeLabel: 'Recurso',
    badgeBgClass: 'bg-violet-50 dark:bg-violet-900/30',
    badgeTextClass: 'text-violet-700 dark:text-violet-400',
    badgeBorderClass: 'border-violet-100 dark:border-violet-800/50',
  },
  {
    termos: ['audiência', 'audiencia'],
    icon: Calendar,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeLabel: 'Audiência',
    badgeBgClass: 'bg-indigo-50 dark:bg-indigo-900/30',
    badgeTextClass: 'text-indigo-700 dark:text-indigo-400',
    badgeBorderClass: 'border-indigo-100 dark:border-indigo-800/50',
  },
];

/** Metadados padrão para eventos sem correspondência */
const META_PADRAO: TimelineItemMeta = {
  icon: Activity,
  colorClass: 'text-muted-foreground',
  badgeLabel: 'Movimento',
  badgeBgClass: 'bg-muted',
  badgeTextClass: 'text-muted-foreground',
  badgeBorderClass: 'border-border',
};

// -----------------------------------------------------------------------------
// Função principal
// -----------------------------------------------------------------------------

/**
 * Retorna metadados visuais para um item da timeline com base no título.
 *
 * @param titulo - Texto do campo `titulo` do item da timeline
 * @param isDocumento - Indica se o item é um documento (true) ou movimento (false)
 * @returns Metadados com ícone, label e classes de cor para badge e ícone
 *
 * @example
 * const meta = getTimelineItemMeta('Petição Inicial', true);
 * // meta.badgeLabel === 'Petição'
 * // meta.icon === FileText
 */
export function getTimelineItemMeta(
  titulo: string,
  isDocumento: boolean
): TimelineItemMeta {
  const tituloNormalizado = titulo.toLowerCase();

  for (const definicao of DEFINICOES_TIPO) {
    const correspondeu = definicao.termos.some((termo) =>
      tituloNormalizado.includes(termo)
    );

    if (correspondeu) {
      return {
        icon: definicao.icon,
        colorClass: definicao.colorClass,
        badgeLabel: definicao.badgeLabel,
        badgeBgClass: definicao.badgeBgClass,
        badgeTextClass: definicao.badgeTextClass,
        badgeBorderClass: definicao.badgeBorderClass,
      };
    }
  }

  // Se for documento sem correspondência específica, usa ícone de arquivo
  if (isDocumento) {
    return {
      icon: FileText,
      colorClass: 'text-muted-foreground',
      badgeLabel: 'Documento',
      badgeBgClass: 'bg-muted',
      badgeTextClass: 'text-muted-foreground',
      badgeBorderClass: 'border-border',
    };
  }

  return META_PADRAO;
}
