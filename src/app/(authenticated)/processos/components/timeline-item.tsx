/**
 * Timeline Item
 *
 * Renderiza um item individual da timeline (documento ou movimento processual).
 * Documentos têm ações (ver/download), movimentos são informativos.
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Activity, Download, ExternalLink, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionGerarUrlDownload } from '@/app/(authenticated)/documentos';
import { GRAU_LABELS } from '@/lib/design-system';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Heading } from '@/components/ui/typography';

interface TimelineItemProps {
  item: TimelineItemEnriquecido & { grauOrigem?: GrauProcesso };
  index: number;
}

/**
 * Formata grau com ordinal para exibição
 */
function formatarGrauComOrdinal(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'Tribunal Superior';
    case 'segundo_grau':
      return '2º Grau';
    case 'primeiro_grau':
      return '1º Grau';
    default:
      return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
  }
}

export function TimelineItem({ item, index }: TimelineItemProps) {
  const [isLoadingPresignedUrl, setIsLoadingPresignedUrl] = useState(false);

  const formatarDataHora = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const isDocumento = item.documento;
  const hasBackblaze = !!item.backblaze;
  const grauOrigem = item.grauOrigem;

  /**
   * Gera presigned URL e abre o documento em nova aba
   */
  const handleOpenDocument = async () => {
    if (!item.backblaze?.key) return;

    setIsLoadingPresignedUrl(true);
    try {
      const result = await actionGerarUrlDownload(item.backblaze.key);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar URL de acesso');
      }

      window.open(result.data.url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast.error('Erro ao abrir documento. Tente novamente.');
    } finally {
      setIsLoadingPresignedUrl(false);
    }
  };

  /**
   * Gera presigned URL e faz download do documento
   */
  const handleDownloadDocument = async () => {
    if (!item.backblaze?.key) return;

    setIsLoadingPresignedUrl(true);
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
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento. Tente novamente.');
    } finally {
      setIsLoadingPresignedUrl(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative flex gap-4"
    >
      {/* Linha vertical */}
      <div className="relative flex flex-col items-center">
        {/* Círculo do item */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isDocumento
              ? 'bg-primary/10 border-primary'
              : 'bg-muted border-muted-foreground'
            }`}
        >
          {isDocumento ? (
            <FileText className="h-5 w-5 text-primary" />
          ) : (
            <Activity className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Linha conectando ao próximo item */}
        <div className="w-0.5 h-full min-h-15 bg-border" />
      </div>

      {/* Conteúdo do item */}
      <Card className="flex-1 p-4 mb-4">
        {/* Header do item */}
        <div className="space-y-2">
          {/* Primeira linha: Instância (se disponível) + Título */}
          <div className="flex items-center gap-2 flex-wrap">
            {grauOrigem && (
              <SemanticBadge category="grau" value={grauOrigem} className="w-fit text-xs">
                {formatarGrauComOrdinal(grauOrigem)}
              </SemanticBadge>
            )}
            <Heading level="card" className="text-base flex-1">{item.titulo}</Heading>
            {item.documentoSigiloso && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AppBadge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Sigiloso
                    </AppBadge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Documento sigiloso - visualização restrita</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatarDataHora(item.data)}
          </p>

          {/* Informações adicionais */}
          <div className="text-sm text-muted-foreground space-y-1">
            {item.nomeResponsavel && (
              <p>
                <span className="font-medium">Responsável:</span>{' '}
                {item.nomeSignatario || item.nomeResponsavel}
              </p>
            )}
          </div>
        </div>

        {/* Ações (apenas para documentos com Backblaze) */}
        {isDocumento && (
          <div className="mt-4 flex gap-2">
            {hasBackblaze ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" aria-label="Abrir em nova aba"
                        variant="default"
                        onClick={handleOpenDocument}
                        disabled={isLoadingPresignedUrl}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver Documento</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" aria-label="Baixar"
                        variant="outline"
                        onClick={handleDownloadDocument}
                        disabled={isLoadingPresignedUrl}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" aria-label="Bloquear" variant="outline" disabled>
                      <Lock className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {item.documentoSigiloso
                        ? 'Documento sigiloso não pode ser baixado'
                        : 'Documento não foi capturado ou enviado para o Backblaze'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
