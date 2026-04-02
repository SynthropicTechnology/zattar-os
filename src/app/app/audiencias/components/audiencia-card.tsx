import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';

interface AudienciaCardProps {
  audiencia: Audiencia;
  compact?: boolean;
  onClick?: (audienciaId: number) => void;
}

export function AudienciaCard({ audiencia, compact = false, onClick }: AudienciaCardProps) {
  const dataInicio = parseISO(audiencia.dataInicio);
  const dataFim = parseISO(audiencia.dataFim);

  // Verifica se tem ata disponível
  const isRealizada = audiencia.status === StatusAudiencia.Finalizada;
  const hasAta = isRealizada && (audiencia.ataAudienciaId || audiencia.urlAtaAudiencia);

  const handleCardClick = () => {
    if (onClick) {
      onClick(audiencia.id);
    }
  };

  return (
    <Card
      className={cn(
        'group relative z-10 my-0.5 w-full cursor-pointer overflow-hidden rounded-md border',
        'transition-all duration-200 ease-in-out hover:shadow-lg',
        compact ? 'h-auto py-1' : 'py-2',
      )}
      onClick={handleCardClick}
    >
      <CardContent className={cn('flex flex-col gap-1', compact ? 'p-2 text-xs' : 'p-3 text-sm')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Indicador de Ata */}
            {hasAta && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-green-500/15 text-green-600 dark:text-green-400">
                    <FileText className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Ata disponível</TooltipContent>
              </Tooltip>
            )}
            <span className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')}>
              {format(dataInicio, 'HH:mm', { locale: ptBR })} - {format(dataFim, 'HH:mm', { locale: ptBR })}
            </span>
          </div>
          <AudienciaStatusBadge status={audiencia.status} compact={compact} />
        </div>
        <div className={cn('font-medium', compact ? 'text-xs truncate' : 'text-sm')}>
          {audiencia.numeroProcesso}
        </div>
        <div className="flex items-center gap-2">
          {audiencia.tipoDescricao && (
            <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {audiencia.tipoDescricao}
            </span>
          )}
          {audiencia.modalidade && <AudienciaModalidadeBadge modalidade={audiencia.modalidade} compact={compact} />}
        </div>
        {!compact && audiencia.observacoes && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {audiencia.observacoes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
