'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  ExternalLink,
  Download,
  Lock,
  Loader2,
  MousePointerClick,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionGerarUrlDownload } from '@/app/(authenticated)/documentos';

type TimelineItemWithGrau = TimelineItemEnriquecido & {
  grauOrigem?: GrauProcesso;
};

interface DocumentViewerPanelProps {
  item: TimelineItemWithGrau | null;
  /** Callback para forçar recaptura da timeline */
  onRecapture?: () => void;
  /** Se uma recaptura está em andamento */
  isCapturing?: boolean;
}

function formatarGrauComOrdinal(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'Tribunal Superior';
    case 'segundo_grau':
      return '2º Grau';
    case 'primeiro_grau':
      return '1º Grau';
    default:
      return grau;
  }
}

export function DocumentViewerPanel({ item, onRecapture, isCapturing }: DocumentViewerPanelProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar presigned URL quando item muda
  useEffect(() => {
    if (!item?.backblaze?.key) {
      setPresignedUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPresignedUrl(null);

    actionGerarUrlDownload(item.backblaze.key)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setPresignedUrl(result.data.url);
        } else {
          throw new Error(
            result.error || 'Erro ao gerar URL de acesso ao documento'
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erro ao buscar URL assinada:', err);
        setError('Erro ao gerar acesso ao documento. Tente novamente.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.backblaze?.key]);

  const handleOpenNewTab = () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!item?.backblaze?.key) return;

    try {
      const result = await actionGerarUrlDownload(item.backblaze.key);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar URL de download');
      }
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = item.backblaze.fileName || 'documento.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      toast.error('Erro ao baixar documento. Tente novamente.');
    }
  };

  // Estado vazio — nenhum documento selecionado
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
        <div className="rounded-full bg-muted p-4">
          <MousePointerClick className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Selecione um documento na timeline para visualizar
        </p>
      </div>
    );
  }

  // Documento sigiloso sem Backblaze
  if (item.documentoSigiloso && !item.backblaze) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
        <div className="rounded-full bg-destructive/10 p-4">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{item.titulo}</p>
          <p className="text-sm text-muted-foreground">
            Documento sigiloso — visualização restrita
          </p>
        </div>
      </div>
    );
  }

  // Documento sem Backblaze (não capturado)
  if (!item.backblaze) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
        <div className="rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{item.titulo}</p>
          <p className="text-sm text-muted-foreground">
            Documento não foi capturado ou enviado para armazenamento
          </p>
          <p className="text-xs text-muted-foreground/70">
            Atualize a timeline para tentar capturar este documento novamente.
          </p>
        </div>
        {onRecapture && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecapture}
            disabled={isCapturing}
            className="gap-2"
          >
            {isCapturing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isCapturing ? 'Capturando...' : 'Atualizar Timeline'}
          </Button>
        )}
      </div>
    );
  }

  const formatarDataHora = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header do documento */}
      <div className="flex-none border-b p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {item.grauOrigem && (
              <SemanticBadge
                category="grau"
                value={item.grauOrigem}
                className="text-xs shrink-0"
              >
                {formatarGrauComOrdinal(item.grauOrigem)}
              </SemanticBadge>
            )}
            <h3 className="font-semibold text-sm truncate">{item.titulo}</h3>
            {item.documentoSigiloso && (
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleOpenNewTab}
                    disabled={!presignedUrl}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir em nova aba</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-x-2">
          <span>{formatarDataHora(item.data)}</span>
          {(item.nomeSignatario || item.nomeResponsavel) && (
            <>
              <span>·</span>
              <span>{item.nomeSignatario || item.nomeResponsavel}</span>
            </>
          )}
        </div>
      </div>

      {/* Área do PDF */}
      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
            <FileText className="h-12 w-12 text-destructive" />
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : (
          presignedUrl && (
            <iframe
              src={`${presignedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full"
              title={item.titulo}
            />
          )
        )}
      </div>
    </div>
  );
}
