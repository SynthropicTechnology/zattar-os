'use client';

/**
 * AudienciasDayList - Lista de audiências do dia selecionado
 *
 * Componente para exibição no painel direito do layout master-detail.
 * Mostra todas as audiências de um dia específico em cards compactos.
 */

import * as React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';

import type { Audiencia } from '../domain';
import { AudienciaCard } from './audiencia-card';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasDayListProps {
  /** Data selecionada para exibir audiências */
  selectedDate: Date;
  /** Todas as audiências (serão filtradas pelo dia) */
  audiencias: Audiencia[];
  /** Callback quando uma audiência é clicada */
  onAudienciaClick?: (audiencia: Audiencia) => void;
  /** Callback para adicionar nova audiência */
  onAddAudiencia?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasDayList({
  selectedDate,
  audiencias,
  onAudienciaClick,
  onAddAudiencia,
  className,
}: AudienciasDayListProps) {
  // Filtrar audiências do dia selecionado
  const audienciasDodia = React.useMemo(() => {
    return audiencias
      .filter((aud) => isSameDay(parseISO(aud.dataInicio), selectedDate))
      .sort((a, b) => {
        // Ordenar por hora de início
        const timeA = parseISO(a.dataInicio).getTime();
        const timeB = parseISO(b.dataInicio).getTime();
        return timeA - timeB;
      });
  }, [audiencias, selectedDate]);

  // Formatar header da data (ex: "Quarta, 12 de Fevereiro")
  const dateHeader = React.useMemo(() => {
    const formatted = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate]);

  // Handler para clique em audiência
  const handleAudienciaClick = React.useCallback(
    (audienciaId: number) => {
      if (onAudienciaClick) {
        const audiencia = audienciasDodia.find((a) => a.id === audienciaId);
        if (audiencia) {
          onAudienciaClick(audiencia);
        }
      }
    },
    [audienciasDodia, onAudienciaClick]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{dateHeader}</span>
        </div>
        {onAddAudiencia && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onAddAudiencia}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nova
          </Button>
        )}
      </div>

      {/* Lista de audiências */}
      {audienciasDodia.length > 0 ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {audienciasDodia.map((audiencia) => (
                <AudienciaCard
                  key={audiencia.id}
                  audiencia={audiencia}
                  compact
                  onClick={handleAudienciaClick}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Footer com contagem */}
          <div className="px-4 py-2 border-t bg-muted/20">
            <AppBadge variant="secondary" className="text-xs">
              {audienciasDodia.length} {audienciasDodia.length === 1 ? 'audiência' : 'audiências'}
            </AppBadge>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Calendar className="h-12 w-12 text-muted-foreground/55 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma audiência neste dia
          </p>
          {onAddAudiencia && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onAddAudiencia}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agendar audiência
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
