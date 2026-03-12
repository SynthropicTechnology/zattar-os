'use client';

/**
 * ViewerToolbar
 *
 * Barra superior do painel de visualização de documentos.
 * Exibe título, data e ações (detalhes, abrir em nova aba, download).
 */

import { Info, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ViewerToolbarProps {
  title: string;
  date?: string;
  isDocumento: boolean;
  hasBackblaze: boolean;
  isLoading: boolean;
  onOpenExternal: () => void;
  onDownload: () => void;
  onOpenDetails: () => void;
}

export function ViewerToolbar({
  title,
  date,
  isDocumento,
  hasBackblaze,
  isLoading,
  onOpenExternal,
  onDownload,
  onOpenDetails,
}: ViewerToolbarProps) {
  const actionsDisabled = isLoading || !hasBackblaze;

  return (
    <div className="h-14 shrink-0 bg-card border-b flex items-center px-3 gap-3">
      {/* Informações do documento */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span
          className={cn('text-sm font-medium truncate leading-tight', !title && 'text-muted-foreground')}
        >
          {title || 'Sem título'}
        </span>
        {date && (
          <span className="text-xs text-muted-foreground font-mono leading-tight">
            {date}
          </span>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-1 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenDetails}
                aria-label="Ver detalhes do evento"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Detalhes do evento</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenExternal}
                disabled={actionsDisabled || !isDocumento}
                aria-label="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir em nova aba</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                disabled={actionsDisabled || !isDocumento}
                aria-label="Baixar documento"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
