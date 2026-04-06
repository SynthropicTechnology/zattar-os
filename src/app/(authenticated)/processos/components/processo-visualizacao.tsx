/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Layout cockpit: CaseIdentityBar + AttentionStrip + PulseTimeline split-panel.
 * Inclui drawer de detalhes de evento e modal de busca CMD+K.
 */

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAgentContext } from '@copilotkit/react-core/v2';
import {
  useProcessoTimeline,
  type TimelineUnificadaMetadata,
} from '../hooks/use-processo-timeline';
import { useProcessoWorkspaceAnnotations } from '../hooks/use-processo-workspace-annotations';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import { actionObterDetalhesComplementaresProcesso } from '../actions';
import { TimelineLoading } from './timeline-loading';
import { TimelineError } from './timeline-error';
import { TimelineEmpty } from './timeline-empty';

// Cockpit components
import { CaseIdentityBar } from './cockpit/case-identity-bar';
import { AttentionStrip } from './cockpit/attention-strip';
import { AllDetailsSheet } from './cockpit/all-details-sheet';
import { PulseTimeline } from './cockpit/pulse-timeline';
import type { FutureTimelineItem } from './cockpit/types';

// Other layout components
import { DocumentViewer } from './viewer/document-viewer';
import { EventDetailDrawer } from './detail/event-detail-drawer';
import { TimelineSearchModal } from './search/timeline-search-modal';
import type { TimelineItemUnificado } from './timeline/types';

import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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

  // Estado do modo de leitura focada
  const [isReadingFocused, setIsReadingFocused] = useState(false);

  // Estado da camada de anotações do workspace
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);

  // Aba mobile controlada (auto-switch para "documento" ao selecionar item)
  const [mobileTab, setMobileTab] = useState<string>('timeline');

  // Estado do AllDetailsSheet
  const [isAllDetailsOpen, setIsAllDetailsOpen] = useState(false);

  // Dados complementares para AttentionStrip
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  // Fetch centralizado de usuários (evita chamadas duplicadas)
  const [usuarios, setUsuarios] = useState<
    Array<{ id: number; nomeExibicao: string; avatarUrl?: string | null }>
  >([]);
  const [usuariosMap, setUsuariosMap] = useState<
    Map<number, { id: number; nomeExibicao: string; avatarUrl?: string | null }>
  >(new Map());

  useEffect(() => {
    let cancelled = false;
    actionListarUsuarios({ ativo: true, limite: 200 })
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data?.usuarios) {
          const lista = (
            result.data.usuarios as Array<{
              id: number;
              nomeExibicao?: string;
              nome_exibicao?: string;
              nome?: string;
              avatarUrl?: string | null;
            }>
          ).map((u) => ({
            id: u.id,
            nomeExibicao:
              u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
            avatarUrl: u.avatarUrl ?? null,
          }));
          setUsuarios(lista);
          setUsuariosMap(new Map(lista.map((u) => [u.id, u])));
        }
      })
      .catch((err) => console.error('Erro ao carregar usuários:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch de dados complementares (audiências, expedientes, perícias) para AttentionStrip
  useEffect(() => {
    if (!processo) return;
    let cancelled = false;

    actionObterDetalhesComplementaresProcesso(processo.id, processo.numeroProcesso)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      })
      .catch((err) => console.error('Erro ao carregar detalhes complementares:', err));

    return () => {
      cancelled = true;
    };
  }, [processo?.id, processo?.numeroProcesso]);

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
    setMobileTab('documento');
  }, []);

  const handleVoltar = useCallback(() => {
    router.push('/processos');
  }, [router]);

  const handleOpenDetails = useCallback(() => {
    if (selectedItem) {
      setIsDrawerOpen(true);
    }
  }, [selectedItem]);

  const handleToggleAnnotations = useCallback(() => {
    setIsAnnotationsOpen((currentState) => !currentState);
  }, []);

  const handleToggleReadingFocus = useCallback(() => {
    setIsReadingFocused((currentState) => !currentState);
  }, []);

  // Items tipados para os novos componentes
  const timelineItems = useMemo(
    () => (timeline?.timeline as TimelineItemUnificado[]) ?? [],
    [timeline]
  );

  // futureItems derivados de audiências e expedientes para PulseTimeline
  const futureItems = useMemo<FutureTimelineItem[]>(() => {
    const now = new Date();
    const items: FutureTimelineItem[] = [];

    // Audiências futuras com status MARCADA
    for (const aud of audiencias) {
      const status = (aud.status || '').toUpperCase();
      if (status !== 'MARCADA') continue;
      const dataFim = aud.dataFim || aud.dataInicio;
      if (new Date(dataFim) < now) continue;
      items.push({
        id: `audiencia-${aud.id}`,
        tipo: 'audiencia',
        data: aud.dataInicio,
        titulo: aud.tipoDescricao || 'Audiência',
        subtitulo: aud.salaAudienciaNome ? `Sala ${aud.salaAudienciaNome}` : undefined,
      });
    }

    // Expedientes com prazo pendente
    for (const exp of expedientes) {
      if (exp.baixadoEm || !exp.dataPrazoLegalParte) continue;
      items.push({
        id: `expediente-${exp.id}`,
        tipo: 'expediente',
        data: exp.dataPrazoLegalParte,
        titulo: 'Prazo de expediente',
        subtitulo: exp.prazoVencido ? 'Prazo vencido' : undefined,
      });
    }

    return items;
  }, [audiencias, expedientes]);

  const {
    currentAnnotations,
    addAnnotation,
    deleteAnnotation,
  } = useProcessoWorkspaceAnnotations({
    processoId: processo?.id ?? id,
    numeroProcesso: processo?.numeroProcesso,
    selectedItem,
  });

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

  useAgentContext({
    description:
      'Contexto completo do processo jurídico aberto na tela. Contém metadados (partes, juízo, status) e a timeline cronológica de movimentações e documentos.',
    value: JSON.parse(JSON.stringify(copilotContext)),
  });

  // Loading inicial
  if (isLoading) {
    return (
      <div className="flex w-full min-h-[calc(100vh-7rem)] flex-col gap-4 pb-8">
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="px-5 py-5 sm:px-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-10 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <div className="rounded-xl border bg-background/70 p-3 space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t px-5 py-5 sm:px-6">
            <div className="rounded-xl border bg-card px-4 py-3 mb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </div>

            <TimelineLoading message="Carregando dados do processo..." embedded />
          </div>
        </section>
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

  const instancias = timeline?.unified
    ? (timeline.metadata as TimelineUnificadaMetadata)?.instancias
    : undefined;

  const hasTimeline =
    !isCapturing && timeline && timeline.timeline.length > 0;

  return (
    <div className="flex w-full min-h-[calc(100vh-7rem)] flex-col">
      {/* CaseIdentityBar — always visible */}
      <CaseIdentityBar
        processo={processo}
        instancias={instancias}
        isCapturing={isCapturing}
        isReadingFocused={isReadingFocused}
        usuarios={usuarios}
        onVoltar={handleVoltar}
        onAtualizarTimeline={forceRecapture}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* AttentionStrip — conditional on hasTimeline */}
      {hasTimeline && (
        <AttentionStrip
          audiencias={audiencias}
          expedientes={expedientes}
          pericias={pericias}
          onOpenAllDetails={() => setIsAllDetailsOpen(true)}
        />
      )}

      {/* Main content area */}
      {(hasTimeline || isCapturing) && (
        <>
          {/* Desktop: Split panel */}
          <div className="hidden md:flex flex-1 min-h-0">
            {isCapturing ? (
              <div className="w-full px-5 py-5">
                <TimelineLoading
                  message={
                    timeline === null
                      ? 'Capturando timeline de todas as instâncias do processo (1º grau, 2º grau, TST)... Isso pode levar alguns minutos.'
                      : 'Atualizando timeline do processo... Isso pode levar alguns minutos.'
                  }
                  isCapturing
                  embedded
                />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="min-h-0 overflow-hidden">
                <ResizablePanel defaultSize={24} minSize={18} maxSize={38} className="min-h-0 overflow-hidden">
                  <PulseTimeline
                    items={timelineItems}
                    futureItems={futureItems}
                    selectedItemId={selectedItem?.id ?? null}
                    onSelectItem={handleSelectItem}
                    processoId={processo.id}
                    graus={processo.grausAtivos}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={76} minSize={50} className="min-h-0 overflow-hidden">
                  <DocumentViewer
                    item={selectedItem}
                    onOpenDetails={handleOpenDetails}
                    annotationsOpen={isAnnotationsOpen}
                    annotations={currentAnnotations}
                    onAddAnnotation={addAnnotation}
                    onDeleteAnnotation={deleteAnnotation}
                    onToggleAnnotations={handleToggleAnnotations}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onToggleReadingFocus={handleToggleReadingFocus}
                    isReadingFocused={isReadingFocused}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden flex-1 min-h-0 overflow-auto px-4 py-4">
            {isCapturing ? (
              <TimelineLoading
                message={
                  timeline === null
                    ? 'Capturando timeline de todas as instâncias do processo (1º grau, 2º grau, TST)... Isso pode levar alguns minutos.'
                    : 'Atualizando timeline do processo... Isso pode levar alguns minutos.'
                }
                isCapturing
                embedded
              />
            ) : (
              <Tabs value={mobileTab} onValueChange={setMobileTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="timeline" className="flex-1">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="documento" className="flex-1">
                    Documento
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="timeline">
                  <div className="h-[70vh] overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <PulseTimeline
                      items={timelineItems}
                      futureItems={futureItems}
                      selectedItemId={selectedItem?.id ?? null}
                      onSelectItem={handleSelectItem}
                      processoId={processo.id}
                      graus={processo.grausAtivos}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="documento">
                  <div className="h-[70vh] overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <DocumentViewer
                      item={selectedItem}
                      onOpenDetails={handleOpenDetails}
                      annotationsOpen={isAnnotationsOpen}
                      annotations={currentAnnotations}
                      onAddAnnotation={addAnnotation}
                      onDeleteAnnotation={deleteAnnotation}
                      onToggleAnnotations={handleToggleAnnotations}
                      onOpenSearch={() => setIsSearchOpen(true)}
                      onToggleReadingFocus={handleToggleReadingFocus}
                      isReadingFocused={isReadingFocused}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </>
      )}

      {/* Estado: Timeline vazia */}
      {!isCapturing && timeline && timeline.timeline.length === 0 && (
        <TimelineEmpty />
      )}

      {/* Modals */}
      {hasTimeline && (
        <>
          <EventDetailDrawer
            item={selectedItem}
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
          />

          <TimelineSearchModal
            items={timelineItems}
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            onSelectItem={handleSelectItem}
          />
        </>
      )}

      {/* AllDetailsSheet */}
      <AllDetailsSheet
        open={isAllDetailsOpen}
        onOpenChange={setIsAllDetailsOpen}
        processoId={processo.id}
        numeroProcesso={processo.numeroProcesso}
        usuariosMap={usuariosMap}
      />

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
