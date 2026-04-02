'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { actionGerarUrlDownload } from '@/app/app/documentos';

import { EventMetadata } from './event-metadata';
import { EventSignatureInfo } from './event-signature-info';
import { EventAttachmentsList } from './event-attachments-list';
import type { TimelineItemUnificado } from '../timeline/types';

interface EventDetailDrawerProps {
  item: TimelineItemUnificado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer lateral (Sheet) com detalhes completos de um evento da timeline.
 * Exibe metadados, informações de assinatura/sigilo, lista de arquivos
 * e botão de download.
 *
 * @example
 * <EventDetailDrawer
 *   item={selectedItem}
 *   open={isDrawerOpen}
 *   onOpenChange={setIsDrawerOpen}
 * />
 */
export function EventDetailDrawer({
  item,
  open,
  onOpenChange,
}: EventDetailDrawerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Gera URL pré-assinada e inicia o download do arquivo.
   */
  async function handleDownload(key: string, fileName: string) {
    setIsDownloading(true);
    try {
      const resultado = await actionGerarUrlDownload(key);

      if (!resultado.success || !resultado.data?.url) {
        toast.error('Não foi possível gerar o link de download.');
        return;
      }

      // Abre a URL em nova aba para iniciar o download
      const link = document.createElement('a');
      link.href = resultado.data.url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Erro ao baixar o arquivo. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  }

  /**
   * Download de todos os arquivos disponíveis (chamado pelo botão do rodapé).
   */
  async function handleDownloadAll() {
    if (!item?.backblaze) return;
    await handleDownload(item.backblaze.key, item.backblaze.fileName);
  }

  /**
   * Callback para abertura de arquivo externo (Google Drive).
   * A navegação é tratada pelo `<a href>` do componente de anexos,
   * mas o callback permite tracking ou ações futuras.
   */
  function handleOpen(_fileId: string) {
    // A abertura real é via <a href> no EventAttachmentsList.
    // Este callback existe para extensibilidade (ex: analytics, logging).
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-100 sm:w-100 p-0 flex flex-col"
      >
        {/* Cabeçalho */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            Detalhes do Evento
          </SheetTitle>
        </SheetHeader>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto">
          {item && (
            <>
              {/* Metadados do evento */}
              <EventMetadata item={item} />

              {/* Informações de assinatura e sigilo */}
              <EventSignatureInfo
                signatario={item.nomeSignatario}
                isSigiloso={item.documentoSigiloso}
              />

              {/* Lista de arquivos */}
              <EventAttachmentsList
                item={item}
                onDownload={handleDownload}
                onOpen={handleOpen}
                isLoading={isDownloading}
              />
            </>
          )}
        </div>

        {/* Rodapé com botão de download — exibido apenas quando há arquivo no Backblaze */}
        {item?.backblaze && (
          <div className="p-6 border-t bg-muted/30 mt-auto shrink-0">
            <Button
              className="w-full gap-2"
              onClick={handleDownloadAll}
              disabled={isDownloading}
            >
              <Download className="size-4" />
              {isDownloading ? 'Baixando...' : 'Baixar Pacote Completo'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
