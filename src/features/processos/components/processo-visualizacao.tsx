/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Layout integrado: header flat + tabs de detalhes + split-panel timeline/documento.
 * Inclui drawer de detalhes de evento e modal de busca CMD+K.
 */

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useCopilotReadable } from '@copilotkit/react-core';
import {
  useProcessoTimeline,
  type TimelineUnificadaMetadata,
} from '../hooks/use-processo-timeline';
import { ProcessoHeader } from './processo-header';
import { ProcessoDetailsTabs } from './processo-details-tabs';
import { TimelineLoading } from './timeline-loading';
import { TimelineError } from './timeline-error';
import { TimelineEmpty } from './timeline-empty';

// Novos componentes redesenhados
import { TimelineSidebar } from './timeline/timeline-sidebar';
import { DocumentViewer } from './viewer/document-viewer';
import { EventDetailDrawer } from './detail/event-detail-drawer';
import { TimelineSearchModal } from './search/timeline-search-modal';
import type { TimelineItemUnificado } from './timeline/types';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  // Estado do item selecionado na timeline
  const [selectedItem, setSelectedItem] =
    useState<TimelineItemUnificado | null>(null);

  // Estado do drawer de detalhes
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Estado do modal de busca
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Auto-selecionar primeiro documento quando timeline carrega
  useEffect(() => {
    if (timeline?.timeline && timeline.timeline.length > 0 && !selectedItem) {
      const firstDoc = timeline.timeline.find(
        (item) => item.documento && item.backblaze
      );
      if (firstDoc) {
        setSelectedItem(firstDoc as TimelineItemUnificado);
      }
    }
  }, [timeline, selectedItem]);

  const handleSelectItem = useCallback((item: TimelineItemUnificado) => {
    setSelectedItem(item);
  }, []);

  const handleVoltar = useCallback(() => {
    router.push('/processos');
  }, [router]);

  const handleOpenDetails = useCallback(() => {
    if (selectedItem) {
      setIsDrawerOpen(true);
    }
  }, [selectedItem]);

  // Dados do processo para o context card da sidebar
  const processoContext = useMemo(() => {
    if (!processo) return undefined;
    const autores = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '';
    const reus = processo.nomeParteReOrigem || processo.nomeParteRe || '';
    return {
      numeroProcesso: processo.numeroProcesso,
      partes: reus ? `${autores} vs. ${reus}` : autores,
      orgao: processo.descricaoOrgaoJulgador || '',
    };
  }, [processo]);

  // Items tipados para os novos componentes
  const timelineItems = useMemo(
    () => (timeline?.timeline as TimelineItemUnificado[]) ?? [],
    [timeline]
  );

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

  // Loading inicial
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <TimelineLoading message="Carregando dados do processo..." />
      </div>
    );
  }

  // Erro ao carregar
  if (error && !processo) {
    return (
      <div className="w-full space-y-6">
        <TimelineError error={error} onRetry={refetch} />
      </div>
    );
  }

  // Processo não encontrado
  if (!processo) {
    return (
      <div className="w-full space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processo não encontrado</AlertTitle>
          <AlertDescription>
            O processo solicitado não foi encontrado ou você não tem permissão
            para acessá-lo.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleVoltar}>
          Voltar para Processos
        </Button>
      </div>
    );
  }

  const hasTimeline =
    !isCapturing && timeline && timeline.timeline.length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Cabeçalho do Processo (flat, sem Card) */}
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
        onVoltar={handleVoltar}
      />

      {/* Tabs: Expedientes, Audiências, Perícias */}
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
          <div className="hidden md:flex h-[calc(100vh-420px)] min-h-125 overflow-hidden rounded-lg border">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                <TimelineSidebar
                  items={timelineItems}
                  selectedItemId={selectedItem?.id ?? null}
                  onSelectItem={handleSelectItem}

                  processo={processoContext}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={40}>
                <DocumentViewer
                  item={selectedItem}
                  onOpenDetails={handleOpenDetails}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

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
                <div className="h-[60vh] overflow-hidden rounded-lg border">
                  <TimelineSidebar
                    items={timelineItems}
                    selectedItemId={selectedItem?.id ?? null}
                    onSelectItem={handleSelectItem}
  
                    processo={processoContext}
                  />
                </div>
              </TabsContent>
              <TabsContent value="documento">
                <div className="h-[60vh] overflow-hidden rounded-lg border">
                  <DocumentViewer
                    item={selectedItem}
                    onOpenDetails={handleOpenDetails}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Drawer de detalhes do evento (Sheet lateral direita) */}
          <EventDetailDrawer
            item={selectedItem}
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
          />

          {/* Modal de busca CMD+K */}
          <TimelineSearchModal
            items={timelineItems}
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            onSelectItem={handleSelectItem}
          />
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
