/**
 * ProcessoStatusBadge - Badge semântico para status de processo
 *
 * Exibe o status do processo com cores semânticas baseadas no design system.
 * Segue o padrão de AudienciaStatusBadge.
 */

import { SemanticBadge } from '@/components/ui/semantic-badge';
import { StatusProcesso, STATUS_PROCESSO_LABELS } from '../domain';

interface ProcessoStatusBadgeProps {
  status: StatusProcesso;
  className?: string;
}

export function ProcessoStatusBadge({ status, className }: ProcessoStatusBadgeProps) {
  return (
    <SemanticBadge category="status" value={status} className={className}>
      {STATUS_PROCESSO_LABELS[status]}
    </SemanticBadge>
  );
}
