'use client';

/**
 * ViewerToolbar
 *
 * Barra de ações flutuante do visualizador de documentos.
 * Aparece como overlay no canto superior direito da área do viewer,
 * mantendo a área de visualização limpa (conforme protótipo 1.html).
 */

import {
  Info,
  ExternalLink,
  Download,
  StickyNote,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewerToolbarProps {
  title: string;
  date?: string;
  isDocumento: boolean;
  hasBackblaze: boolean;
  isLoading: boolean;
  annotationCount: number;
  annotationsOpen: boolean;
  isReadingFocused: boolean;
  onOpenSearch: () => void;
  onOpenExternal: () => void;
  onDownload: () => void;
  onOpenDetails: () => void;
  onToggleAnnotations: () => void;
  onToggleReadingFocus: () => void;
}

export function ViewerToolbar({
  title,
  date,
  isDocumento,
  hasBackblaze,
  isLoading,
  annotationCount,
  annotationsOpen,
  isReadingFocused,
  onOpenSearch,
  onOpenExternal,
  onDownload,
  onOpenDetails,
  onToggleAnnotations,
  onToggleReadingFocus,
}: ViewerToolbarProps) {
  const actionsDisabled = isLoading || !hasBackblaze;

  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
      {/* Título do documento atual */}
      {title && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-sm border shadow-sm px-3 py-1.5 min-w-0 max-w-xs lg:max-w-sm">
          <p className="truncate text-xs font-medium text-foreground">{title}</p>
          {date && (
            <>
              <span className="text-muted-foreground/50 shrink-0" aria-hidden="true">&middot;</span>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{date}</span>
            </>
          )}
        </div>
      )}

      {/* Ações */}
      <TooltipProvider>
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm border shadow-sm px-1 py-0.5 ml-auto shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={onOpenSearch}
                aria-label="Buscar na timeline"
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar na timeline</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={onOpenDetails}
                aria-label="Ver detalhes do evento"
              >
                <Info className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Detalhes do evento</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={annotationsOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="relative size-8 rounded-full"
                onClick={onToggleAnnotations}
                aria-label="Alternar anotações"
              >
                <StickyNote className="size-4" />
                {annotationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {annotationCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {annotationsOpen ? 'Ocultar anotações' : 'Exibir anotações'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={onToggleReadingFocus}
                aria-label="Alternar leitura focada"
              >
                {isReadingFocused ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadingFocused ? 'Sair da leitura focada' : 'Leitura focada'}
            </TooltipContent>
          </Tooltip>

          {isDocumento && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={onOpenExternal}
                    disabled={actionsDisabled}
                    aria-label="Abrir em nova aba"
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir em nova aba</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={onDownload}
                    disabled={actionsDisabled}
                    aria-label="Baixar documento"
                  >
                    <Download className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
