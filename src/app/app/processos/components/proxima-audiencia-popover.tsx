/**
 * ProximaAudienciaPopover - Popover com informações da próxima audiência
 *
 * Exibe um ícone de calendário que, ao clicar, mostra um popover
 * com as informações da próxima audiência do processo.
 */

'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ProximaAudienciaPopoverProps {
  dataAudiencia: string | null;
  className?: string;
}

function formatarDataAudiencia(dataISO: string): { data: string; hora: string } {
  try {
    const date = new Date(dataISO);
    const data = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const hora = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { data, hora };
  } catch {
    return { data: 'Data inválida', hora: '-' };
  }
}

function calcularDiasRestantes(dataISO: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataAudiencia = new Date(dataISO);
  dataAudiencia.setHours(0, 0, 0, 0);
  const diffTime = dataAudiencia.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function ProximaAudienciaPopover({
  dataAudiencia,
  className,
}: ProximaAudienciaPopoverProps) {
  // Defer cálculos de data para o client para evitar hydration mismatch (server UTC vs client BRT)
  const [clientData, setClientData] = React.useState<{
    data: string;
    hora: string;
    diasRestantes: number;
  } | null>(null);

  React.useEffect(() => {
    if (dataAudiencia) {
      setClientData({
        ...formatarDataAudiencia(dataAudiencia),
        diasRestantes: calcularDiasRestantes(dataAudiencia),
      });
    }
  }, [dataAudiencia]);

  if (!dataAudiencia) {
    return null;
  }

  const diasRestantes = clientData?.diasRestantes ?? 0;

  const getUrgenciaColor = () => {
    if (!clientData) return 'text-primary';
    if (diasRestantes < 0) return 'text-muted-foreground'; // Passada
    if (diasRestantes <= 3) return 'text-destructive'; // Urgente
    if (diasRestantes <= 7) return 'text-warning'; // Atenção
    return 'text-primary'; // Normal
  };

  const getUrgenciaLabel = () => {
    if (!clientData) return '';
    if (diasRestantes < 0) return `Há ${Math.abs(diasRestantes)} dia(s)`;
    if (diasRestantes === 0) return 'Hoje';
    if (diasRestantes === 1) return 'Amanhã';
    return `Em ${diasRestantes} dias`;
  };

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-5 w-5 p-0', getUrgenciaColor(), className)}
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="sr-only">Ver próxima audiência</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Próxima audiência</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        className="w-64 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className={cn('h-4 w-4', getUrgenciaColor())} />
            <h4 className="font-medium text-sm">Próxima Audiência</h4>
          </div>
          {clientData && (
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground capitalize">{clientData.data}</p>
              <p className="font-medium">às {clientData.hora}</p>
              <p className={cn('text-xs font-medium', getUrgenciaColor())}>
                {getUrgenciaLabel()}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
