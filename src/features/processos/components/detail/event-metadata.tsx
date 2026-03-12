'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Tipos para o item da timeline unificado
 */
interface TimelineItemEnriquecido {
  id: number;
  titulo: string;
  data: string;
  documento: boolean;
  documentoSigiloso?: boolean;
  nomeResponsavel?: string;
  nomeSignatario?: string;
  backblaze?: {
    url: string;
    key: string;
    bucket: string;
    fileName: string;
    uploadedAt: string;
  };
  googleDrive?: {
    fileId: string;
    webViewLink: string;
    directLink: string;
  };
}

interface TimelineItemUnificado extends TimelineItemEnriquecido {
  grauOrigem?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
  trtOrigem?: string;
  instanciaId?: number;
}

interface EventMetadataProps {
  item: TimelineItemUnificado;
}

/**
 * Linha de metadado com label e valor.
 */
function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[13px] text-muted-foreground font-medium shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-foreground text-right min-w-0">
        {children}
      </span>
    </div>
  );
}

/**
 * Exibe pares chave-valor com os metadados principais de um evento da timeline.
 *
 * @example
 * <EventMetadata item={timelineItem} />
 */
export function EventMetadata({ item }: EventMetadataProps) {
  // Formata a data como "dd MMM yyyy, HH:mm" em pt-BR
  const dataFormatada = (() => {
    try {
      return format(new Date(item.data), "dd MMM yyyy, HH:mm", { locale: ptBR });
    } catch {
      return item.data;
    }
  })();

  return (
    <div className="px-6 py-6 border-b">
      <div className="flex flex-col gap-4">
        {/* ID */}
        <MetadataRow label="ID">
          <span
            className={cn(
              'font-mono bg-muted px-2 py-0.5 rounded-lg border text-xs'
            )}
          >
            {item.id}
          </span>
        </MetadataRow>

        {/* Data de Publicação */}
        <MetadataRow label="Data de Publicação">
          {dataFormatada}
        </MetadataRow>

        {/* Tipo — sempre exibido */}
        <MetadataRow label="Tipo">
          <span className="font-medium">
            {item.documento ? 'Documento' : 'Movimentação'}
          </span>
        </MetadataRow>

        {/* Responsável — exibido apenas quando disponível */}
        {item.nomeResponsavel && (
          <MetadataRow label="Responsável">
            {item.nomeResponsavel}
          </MetadataRow>
        )}

        {/* Arquivo — exibido apenas quando disponível */}
        {item.backblaze?.fileName && (
          <MetadataRow label="Arquivo">
            <span className="truncate max-w-[200px] block">
              {item.backblaze.fileName}
            </span>
          </MetadataRow>
        )}
      </div>
    </div>
  );
}
