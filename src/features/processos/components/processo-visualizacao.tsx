/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Layout master-detail: timeline na esquerda, viewer de documento na direita.
 * Mobile: Tabs (Timeline | Documento).
 */

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCopilotReadable } from '@copilotkit/react-core';
import {
  useProcessoTimeline,
  type TimelineUnificadaMetadata,
} from '../hooks/use-processo-timeline';
import { ProcessoHeader } from './processo-header';
import { ProcessoDetailsTabs } from './processo-details-tabs';
import { TimelineSidebar } from './timeline-sidebar';
import { DocumentViewerPanel } from './document-viewer-panel';
import { TimelineLoading } from './timeline-loading';
import { TimelineError } from './timeline-error';
import { TimelineEmpty } from './timeline-empty';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/features/partes';

type TimelineItemWithGrau = TimelineItemEnriquecido & {
  grauOrigem?: GrauProcesso;
};

interface ProcessoVisualizacaoProps {
  id: number;
}

export function ProcessoVisualizacao({ id }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  const {
    processo,
    timeline,
    isLoading,
    isCapturing,
    error,
    refetch,
    forceRecapture,
  } = useProcessoTimeline(id);

  const [selectedItem, setSelectedItem] =
    useState<TimelineItemWithGrau | null>(null);

  // Auto-selecionar primeiro documento quando timeline carrega
  useEffect(() => {
    if (timeline?.timeline && timeline.timeline.length > 0 && !selectedItem) {
      const firstDoc = timeline.timeline.find(
        (item) => item.documento && item.backblaze
      );
      if (firstDoc) {
        setSelectedItem(firstDoc as TimelineItemWithGrau);
      }
    }
  }, [timeline, selectedItem]);

  const handleSelectItem = useCallback((item: TimelineItemWithGrau) => {
    setSelectedItem(item);
  }, []);

  // CopilotKit context
  const copilotContext = useMemo(
    () => ({
      status_carregamento: isLoading ? 'Carregando...' : 'Dados carregados',
      metadados: processo
        ? {
            numero: processo.numeroProcesso,
            tribunal: processo.trtOrigem || processo.trt,
            autores:
              processo.nomeParteAutoraOrigem || processo.nomeParteAutora,
            reus: processo.nomeParteReOrigem || processo.nomeParteRe,
            status: processo.codigoStatusProcesso,
            orgao_julgador: processo.descricaoOrgaoJulgador,
            data_autuacao:
              processo.dataAutuacaoOrigem || processo.dataAutuacao,
            segredo_justica: processo.segredoJustica,
          }
        : 'Sem dados do processo',
      historico_movimentacoes: timeline?.timeline
        ? timeline.timeline.map((item) => ({
            data: item.data,
            titulo: item.titulo,
            tipo: item.documento ? 'Documento' : 'Movimentação',
            responsavel: item.nomeResponsavel || item.nomeSignatario,
            sigiloso: item.documentoSigiloso,
          }))
        : 'Timeline vazia ou carregando',
    }),
    [isLoading, processo, timeline]
  );

  useCopilotReadable({
    description:
      'Contexto completo do processo jurídico aberto na tela. Contém metadados (partes, juízo, status) e a timeline cronológica de movimentações e documentos.',
    value: copilotContext,
  });

  const backButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.push('/processos')}
      className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      title="Voltar para Processos"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );

  // Loading inicial
  if (isLoading) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">{backButton}</div>
        <TimelineLoading message="Carregando dados do processo..." />
      </div>
    );
  }

  // Erro ao carregar
  if (error && !processo) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">{backButton}</div>
        <TimelineError error={error} onRetry={refetch} />
      </div>
    );
  }

  // Processo não encontrado
  if (!processo) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">{backButton}</div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processo não encontrado</AlertTitle>
          <AlertDescription>
            O processo solicitado não foi encontrado ou você não tem permissão
            para acessá-lo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasTimeline =
    !isCapturing && timeline && timeline.timeline.length > 0;

  return (
    <div className="w-full py-8 space-y-4">
      {/* Seta de voltar */}
      <div className="flex items-center">{backButton}</div>

      {/* Dados do processo */}
      <ProcessoHeader
        processo={processo}
        instancias={
          timeline?.unified
            ? (timeline.metadata as TimelineUnificadaMetadata)?.instancias
            : undefined
        }
        duplicatasRemovidas={
          timeline?.unified
            ? (timeline.metadata as TimelineUnificadaMetadata)
                ?.duplicatasRemovidas
            : undefined
        }
        onAtualizarTimeline={forceRecapture}
        isCapturing={isCapturing}
      />

      {/* Audiências, Expedientes e Perícias */}
      <ProcessoDetailsTabs
        processoId={processo.id}
        numeroProcesso={processo.numeroProcesso}
      />

      {/* Estado: Capturando timeline */}
      {isCapturing && (
        <TimelineLoading
          message={
            timeline === null
              ? 'Capturando timeline de todas as instâncias do processo (1º grau, 2º grau, TST)... Isso pode levar alguns minutos.'
              : 'Capturando timeline do processo... Isso pode levar alguns minutos.'
          }
          isCapturing
        />
      )}

      {/* Estado: Timeline vazia */}
      {!isCapturing && timeline && timeline.timeline.length === 0 && (
        <TimelineEmpty />
      )}

      {/* Estado: Timeline carregada — split-panel */}
      {hasTimeline && (
        <>
          {/* Desktop: ResizablePanelGroup */}
          <Card className="hidden md:flex h-[calc(100vh-420px)] min-h-125 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                <TimelineSidebar
                  items={timeline.timeline as TimelineItemWithGrau[]}
                  selectedItemId={selectedItem?.id ?? null}
                  onSelectItem={handleSelectItem}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={40}>
                <DocumentViewerPanel item={selectedItem} onRecapture={forceRecapture} isCapturing={isCapturing} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>

          {/* Mobile: Tabs */}
          <div className="md:hidden">
            <Tabs defaultValue="timeline">
              <TabsList className="w-full">
                <TabsTrigger value="timeline" className="flex-1">
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="documento" className="flex-1">
                  Documento
                </TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                <Card className="h-[60vh] overflow-hidden">
                  <TimelineSidebar
                    items={timeline.timeline as TimelineItemWithGrau[]}
                    selectedItemId={selectedItem?.id ?? null}
                    onSelectItem={handleSelectItem}
                  />
                </Card>
              </TabsContent>
              <TabsContent value="documento">
                <Card className="h-[60vh] overflow-hidden">
                  <DocumentViewerPanel item={selectedItem} onRecapture={forceRecapture} isCapturing={isCapturing} />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Estado: Erro durante captura */}
      {error && processo && (
        <TimelineError
          error={error}
          onRetry={refetch}
          message="Ocorreu um erro ao capturar a timeline do processo."
        />
      )}
    </div>
  );
}
