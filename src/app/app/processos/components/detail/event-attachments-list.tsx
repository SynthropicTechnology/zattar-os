'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItemUnificado } from '../timeline/types';

interface EventAttachmentsListProps {
  item: TimelineItemUnificado;
  onDownload: (key: string, fileName: string) => void;
  onOpen: (key: string) => void;
  isLoading: boolean;
}

/**
 * Lista de anexos disponíveis para download ou visualização.
 * Suporta arquivos do Backblaze B2 e Google Drive.
 *
 * @example
 * <EventAttachmentsList
 *   item={timelineItem}
 *   onDownload={(key, fileName) => handleDownload(key, fileName)}
 *   onOpen={(key) => handleOpen(key)}
 *   isLoading={false}
 * />
 */
export function EventAttachmentsList({
  item,
  onDownload,
  onOpen,
  isLoading,
}: EventAttachmentsListProps) {
  const temBackblaze = !!item.backblaze;
  const temGoogleDrive = !!item.googleDrive;
  const temArquivo = temBackblaze || temGoogleDrive;

  return (
    <div className="px-6 py-6">
      <h3 className="text-sm font-semibold mb-4 tracking-tight">Arquivos Anexos</h3>

      {!temArquivo ? (
        /* Estado vazio */
        <p className="text-[13px] text-muted-foreground">
          Nenhum arquivo disponível.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Arquivo do Backblaze B2 */}
          {temBackblaze && item.backblaze && (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Baixar ${item.backblaze.fileName}`}
              onClick={() =>
                !isLoading &&
                onDownload(item.backblaze!.key, item.backblaze!.fileName)
              }
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
                  onDownload(item.backblaze!.key, item.backblaze!.fileName);
                }
              }}
              className={cn(
                'group flex items-center justify-between h-10 px-3',
                'rounded-lg border hover:border-primary/30 hover:bg-primary/5',
                'transition-all cursor-pointer bg-card',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Lado esquerdo: ícone + nome do arquivo */}
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-4.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="text-[13px] font-medium truncate">
                  {item.backblaze.fileName}
                </span>
              </div>

              {/* Lado direito: ícone de download (visível ao hover) */}
              <div className="shrink-0 pl-3">
                <Download className="size-4.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}

          {/* Arquivo do Google Drive */}
          {temGoogleDrive && item.googleDrive && (
            <a
              href={item.googleDrive.linkVisualizacao}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visualizar no Google Drive"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(item.googleDrive!.fileId);
              }}
              className={cn(
                'group flex items-center justify-between h-10 px-3',
                'rounded-lg border hover:border-primary/30 hover:bg-primary/5',
                'transition-all cursor-pointer bg-card no-underline'
              )}
            >
              {/* Lado esquerdo: ícone + label */}
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-4.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="text-[13px] font-medium truncate text-foreground">
                  Visualizar no Drive
                </span>
              </div>

              {/* Lado direito: ícone externo (visível ao hover) */}
              <div className="shrink-0 pl-3">
                <ExternalLink className="size-4.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
