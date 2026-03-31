'use client';

/**
 * PericiasDayList - Lista de perícias do dia selecionado
 *
 * Componente para exibição no painel direito do layout master-detail.
 * Mostra todas as perícias de um dia específico em cards compactos.
 */

import * as React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';

import type { Pericia, SituacaoPericiaCodigo } from '../domain';
import { SITUACAO_PERICIA_LABELS } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasDayListProps {
  /** Data selecionada para exibir perícias */
  selectedDate: Date;
  /** Todas as perícias (serão filtradas pelo dia) */
  pericias: Pericia[];
  /** Callback para adicionar nova perícia */
  onAddPericia?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasDayList({
  selectedDate,
  pericias,
  onAddPericia,
  className,
}: PericiasDayListProps) {
  // Filtrar perícias do dia selecionado
  const periciasDoDia = React.useMemo(() => {
    return pericias
      .filter((pericia) => {
        // Perícias sem data não aparecem
        if (!pericia.prazoEntrega) return false;

        return isSameDay(parseISO(pericia.prazoEntrega), selectedDate);
      })
      .sort((a, b) => {
        // Vencidas (prazo anterior à data atual AND laudoJuntado === false) primeiro
        const now = new Date();
        const aVencidoPendente =
          a.prazoEntrega &&
          parseISO(a.prazoEntrega) < now &&
          !a.laudoJuntado;
        const bVencidoPendente =
          b.prazoEntrega &&
          parseISO(b.prazoEntrega) < now &&
          !b.laudoJuntado;

        if (aVencidoPendente && !bVencidoPendente) return -1;
        if (!aVencidoPendente && bVencidoPendente) return 1;

        // Depois ordenar por prazoEntrega
        const dateA = a.prazoEntrega ? parseISO(a.prazoEntrega).getTime() : 0;
        const dateB = b.prazoEntrega ? parseISO(b.prazoEntrega).getTime() : 0;
        return dateA - dateB;
      });
  }, [pericias, selectedDate]);

  // Formatar header da data (ex: "Quarta, 12 de Fevereiro")
  const dateHeader = React.useMemo(() => {
    const formatted = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate]);

  // Determinar variante do badge por situação
  const getBadgeVariant = React.useCallback((situacao: SituacaoPericiaCodigo) => {
    switch (situacao) {
      case 'F': // FINALIZADA
        return 'success' as const;
      case 'P': // LAUDO_JUNTADO
        return 'default' as const;
      case 'C': // CANCELADA
        return 'destructive' as const;
      case 'L': // AGUARDANDO_LAUDO
        return 'warning' as const;
      case 'S': // AGUARDANDO_ESCLARECIMENTOS
        return 'warning' as const;
      case 'R': // REDESIGNADA
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{dateHeader}</span>
        </div>
        {onAddPericia && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onAddPericia}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo
          </Button>
        )}
      </div>

      {/* Lista de perícias */}
      {periciasDoDia.length > 0 ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {periciasDoDia.map((pericia) => {
                const situacaoLabel = SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo];
                const badgeVariant = getBadgeVariant(pericia.situacaoCodigo);

                return (
                  <div
                    key={pericia.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-1.5"
                  >
                    {/* Primeira linha: número do processo + badge situação */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-mono font-medium truncate">
                        {pericia.numeroProcesso}
                      </span>
                      <AppBadge variant={badgeVariant} className="shrink-0 text-xs">
                        {situacaoLabel}
                      </AppBadge>
                    </div>

                    {/* Segunda linha: especialidade + perito */}
                    <div className="text-xs text-muted-foreground">
                      {pericia.especialidade?.descricao && (
                        <span className="font-medium">
                          {pericia.especialidade.descricao}
                        </span>
                      )}
                      {pericia.perito?.nome && (
                        <span className={pericia.especialidade?.descricao ? 'ml-1.5' : ''}>
                          {pericia.especialidade?.descricao ? '• ' : ''}
                          {pericia.perito.nome}
                        </span>
                      )}
                      {!pericia.especialidade?.descricao && !pericia.perito?.nome && (
                        <span className="text-muted-foreground/60">Sem especialidade/perito</span>
                      )}
                    </div>

                    {/* Terceira linha: partes */}
                    <div className="text-xs text-muted-foreground/80 truncate">
                      {pericia.processo?.nomeParteAutora || '-'}
                      {' vs '}
                      {pericia.processo?.nomeParteRe || '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer com contagem */}
          <div className="px-4 py-2 border-t bg-muted/20">
            <AppBadge variant="secondary" className="text-xs">
              {periciasDoDia.length} {periciasDoDia.length === 1 ? 'perícia' : 'perícias'}
            </AppBadge>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Calendar className="h-12 w-12 text-muted-foreground/55 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma perícia neste dia
          </p>
          {onAddPericia && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onAddPericia}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova Perícia
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
