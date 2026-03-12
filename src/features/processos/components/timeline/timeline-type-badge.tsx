'use client';

/**
 * TimelineTypeBadge
 *
 * Badge colorido indicando o tipo de evento processual (Petição, Citação, Decisão, etc).
 * As cores são determinadas externamente via classes Tailwind passadas por props.
 */

import { cn } from '@/lib/utils';

interface TimelineTypeBadgeProps {
  /** Texto exibido no badge, ex: "Petição", "Decisão" */
  label: string;
  /** Classe de cor de fundo do badge, ex: "bg-sky-50 dark:bg-sky-900/30" */
  bgClass: string;
  /** Classe de cor de texto do badge, ex: "text-sky-700 dark:text-sky-400" */
  textClass: string;
  /** Classe de cor de borda do badge, ex: "border-sky-100 dark:border-sky-800/50" */
  borderClass: string;
  /** Classes adicionais opcionais */
  className?: string;
}

/**
 * Badge compacto para identificar o tipo de evento da timeline.
 *
 * @example
 * <TimelineTypeBadge
 *   label="Decisão"
 *   bgClass="bg-green-50 dark:bg-green-900/30"
 *   textClass="text-green-700 dark:text-green-400"
 *   borderClass="border-green-100 dark:border-green-800/50"
 * />
 */
export function TimelineTypeBadge({
  label,
  bgClass,
  textClass,
  borderClass,
  className,
}: TimelineTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        'px-1.5 py-0.5 rounded-sm',
        'text-[10px] font-semibold uppercase tracking-wider',
        'border',
        bgClass,
        textClass,
        borderClass,
        className
      )}
    >
      {label}
    </span>
  );
}
