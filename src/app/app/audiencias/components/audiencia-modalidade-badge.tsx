import { ModalidadeAudiencia, MODALIDADE_AUDIENCIA_LABELS } from '../domain';
import { IconCircle } from '@/components/ui/icon-circle';
import { cn } from '@/lib/utils';
import { Video, MapPin, GitCompareArrows } from 'lucide-react';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { SemanticBadge } from '@/components/ui/semantic-badge';

/**
 * AudienciaModalidadeBadge - Badge para exibir modalidade de audiência.
 *
 * @ai-context Este componente usa o sistema de variantes semânticas.
 * A cor é determinada automaticamente pelo mapeamento em @/lib/design-system/variants.ts.
 *
 * @example
 * <AudienciaModalidadeBadge modalidade={ModalidadeAudiencia.Virtual} />
 * <AudienciaModalidadeBadge modalidade={ModalidadeAudiencia.Presencial} compact />
 */
interface AudienciaModalidadeBadgeProps {
  modalidade: ModalidadeAudiencia | null;
  className?: string;
  compact?: boolean;
}

/**
 * Mapeamento de modalidade para ícone.
 * Mantido localmente pois é específico deste componente.
 */
const MODALIDADE_ICONS: Record<ModalidadeAudiencia, React.ElementType | null> = {
  [ModalidadeAudiencia.Virtual]: Video,
  [ModalidadeAudiencia.Presencial]: MapPin,
  [ModalidadeAudiencia.Hibrida]: GitCompareArrows,
};

const VARIANT_TO_CIRCLE_CLASS: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-200',
  warning: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  destructive: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-200',
  neutral: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200',
  accent: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  default: 'border-border bg-background text-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-background text-foreground',
};

export function AudienciaModalidadeBadge({
  modalidade,
  className,
  compact = false,
}: AudienciaModalidadeBadgeProps) {
  if (!modalidade) {
    return null;
  }

  const variant = getSemanticBadgeVariant('audiencia_modalidade', modalidade);
  const Icon = MODALIDADE_ICONS[modalidade];

  if (compact) {
    if (!Icon) return null;

    return (
      <IconCircle
        icon={Icon}
        size="sm"
        className={cn(VARIANT_TO_CIRCLE_CLASS[variant] ?? VARIANT_TO_CIRCLE_CLASS.neutral, className)}
        aria-label={MODALIDADE_AUDIENCIA_LABELS[modalidade]}
        title={MODALIDADE_AUDIENCIA_LABELS[modalidade]}
      />
    );
  }

  return (
    <SemanticBadge category="audiencia_modalidade" value={modalidade} className={cn('flex items-center gap-1', className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {MODALIDADE_AUDIENCIA_LABELS[modalidade]}
    </SemanticBadge>
  );
}
