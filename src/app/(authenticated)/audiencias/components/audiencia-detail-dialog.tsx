'use client';

import * as React from 'react';
import {
  Clock,
  ExternalLink,
  Copy,
  Pencil,
  Video,
  FileText,
  Building2,
  Loader2,
  Check,
  AlertCircle,
  MessageSquare,
  X,
  Gavel,
  ChevronDown,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
import {
  type Audiencia,
  type EnderecoPresencial,
  ModalidadeAudiencia,
  PresencaHibrida,
  GRAU_TRIBUNAL_LABELS,
  TRT_NOMES,
  isAudienciaCapturada,
  buildPjeUrl,
} from '../domain';
import {
  actionBuscarAudienciaPorId,
  actionAtualizarUrlVirtual,
  actionAtualizarEnderecoPresencial,
  actionAtualizarObservacoes,
  actionAtualizarAudienciaPayload,
} from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { cn } from '@/lib/utils';

const MODALIDADE_LABELS: Record<ModalidadeAudiencia, string> = {
  [ModalidadeAudiencia.Virtual]: 'Virtual',
  [ModalidadeAudiencia.Presencial]: 'Presencial',
  [ModalidadeAudiencia.Hibrida]: 'Híbrida',
};

const MODALIDADE_ICONS: Record<ModalidadeAudiencia, React.ComponentType<{ className?: string }>> = {
  [ModalidadeAudiencia.Virtual]: Video,
  [ModalidadeAudiencia.Presencial]: Building2,
  [ModalidadeAudiencia.Hibrida]: Globe,
};

// =============================================================================
// SECTION HELPERS
// =============================================================================

function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="size-3.5 text-primary" />
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
        {label}
      </h4>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-muted/40 border border-border/30 p-[14px_16px]',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// PROPS
// =============================================================================

export interface AudienciaDetailDialogProps {
  audienciaId?: number;
  audiencia?: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AudienciaDetailDialog({
  audienciaId,
  audiencia: audienciaProp,
  open,
  onOpenChange,
}: AudienciaDetailDialogProps) {
  const [fetchedAudiencia, setFetchedAudiencia] = React.useState<Audiencia | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const [editingUrl, setEditingUrl] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState('');
  const [savingUrl, setSavingUrl] = React.useState(false);

  const [editingEndereco, setEditingEndereco] = React.useState(false);
  const [enderecoDraft, setEnderecoDraft] = React.useState<EnderecoPresencial>({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  });
  const [savingEndereco, setSavingEndereco] = React.useState(false);

  const [editingObs, setEditingObs] = React.useState(false);
  const [obsDraft, setObsDraft] = React.useState('');
  const [savingObs, setSavingObs] = React.useState(false);

  const [savingModalidade, setSavingModalidade] = React.useState(false);
  const [modalidadePopoverOpen, setModalidadePopoverOpen] = React.useState(false);

  const [savingPresenca, setSavingPresenca] = React.useState(false);

  const [ataOpen, setAtaOpen] = React.useState(false);

  const { usuarios } = useUsuarios();

  const shouldFetch = !!audienciaId && !audienciaProp;

  React.useEffect(() => {
    if (!shouldFetch || !open) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    actionBuscarAudienciaPorId(audienciaId!)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setFetchedAudiencia(result.data);
        } else if (!result.success) {
          setError(result.error || 'Erro ao buscar audiência');
        } else {
          setError('Audiência não encontrada');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [audienciaId, shouldFetch, open]);

  React.useEffect(() => {
    if (!open) setAtaOpen(false);
  }, [open]);

  const audiencia = audienciaProp || fetchedAudiencia;
  const isPje = audiencia ? isAudienciaCapturada(audiencia) : false;
  const pjeUrl = audiencia ? buildPjeUrl(audiencia.trt, audiencia.numeroProcesso) : '';
  const hasAta = !!audiencia?.urlAtaAudiencia;

  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const dataFim = audiencia ? parseISO(audiencia.dataFim) : null;

  const poloAtivo = audiencia?.poloAtivoOrigem || audiencia?.poloAtivoNome || '—';
  const poloPassivo = audiencia?.poloPassivoOrigem || audiencia?.poloPassivoNome || '—';
  const orgaoJulgador =
    audiencia?.orgaoJulgadorDescricao ||
    audiencia?.orgaoJulgadorOrigem ||
    audiencia?.salaAudienciaNome ||
    null;

  const handleCopyUrl = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // silencioso
    }
  }, []);

  const handleStartEditUrl = React.useCallback(() => {
    setUrlDraft(audiencia?.urlAudienciaVirtual || '');
    setEditingUrl(true);
  }, [audiencia]);

  const handleSaveUrl = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingUrl(true);
    const result = await actionAtualizarUrlVirtual(audiencia.id, urlDraft || null);
    if (result.success) {
      setEditingUrl(false);
      onOpenChange(false);
    }
    setSavingUrl(false);
  }, [audiencia, urlDraft, onOpenChange]);

  const handleStartEditEndereco = React.useCallback(() => {
    const e = audiencia?.enderecoPresencial;
    setEnderecoDraft({
      cep: e?.cep || '', logradouro: e?.logradouro || '', numero: e?.numero || '',
      complemento: e?.complemento || '', bairro: e?.bairro || '', cidade: e?.cidade || '', uf: e?.uf || '',
    });
    setEditingEndereco(true);
  }, [audiencia]);

  const handleSaveEndereco = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingEndereco(true);
    const hasData = enderecoDraft.logradouro && enderecoDraft.numero && enderecoDraft.cidade && enderecoDraft.uf;
    const result = await actionAtualizarEnderecoPresencial(audiencia.id, hasData ? enderecoDraft : null);
    if (result.success) {
      setEditingEndereco(false);
      onOpenChange(false);
    }
    setSavingEndereco(false);
  }, [audiencia, enderecoDraft, onOpenChange]);

  const handleStartEditObs = React.useCallback(() => {
    setObsDraft(audiencia?.observacoes || '');
    setEditingObs(true);
  }, [audiencia]);

  const handleSaveObs = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingObs(true);
    const result = await actionAtualizarObservacoes(audiencia.id, obsDraft || null);
    if (result.success) {
      setEditingObs(false);
      onOpenChange(false);
    }
    setSavingObs(false);
  }, [audiencia, obsDraft, onOpenChange]);

  const handleChangeModalidade = React.useCallback(
    async (novaModalidade: ModalidadeAudiencia) => {
      if (!audiencia || novaModalidade === audiencia.modalidade) {
        setModalidadePopoverOpen(false);
        return;
      }
      setSavingModalidade(true);
      setModalidadePopoverOpen(false);
      const result = await actionAtualizarAudienciaPayload(audiencia.id, { modalidade: novaModalidade });
      if (result.success) {
        onOpenChange(false);
      }
      setSavingModalidade(false);
    },
    [audiencia, onOpenChange]
  );

  const handleChangePresencaHibrida = React.useCallback(
    async (valor: PresencaHibrida) => {
      if (!audiencia) return;
      setSavingPresenca(true);
      const result = await actionAtualizarAudienciaPayload(audiencia.id, { presencaHibrida: valor });
      if (result.success) {
        onOpenChange(false);
      }
      setSavingPresenca(false);
    },
    [audiencia, onOpenChange]
  );

  const hasIndicadores =
    audiencia &&
    (audiencia.segredoJustica || audiencia.juizoDigital || audiencia.designada || audiencia.documentoAtivo);

  const isVirtual = audiencia?.modalidade === ModalidadeAudiencia.Virtual;
  const isPresencial = audiencia?.modalidade === ModalidadeAudiencia.Presencial;
  const isHibrida = audiencia?.modalidade === ModalidadeAudiencia.Hibrida;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[92vh] flex p-0 gap-0 overflow-hidden [scrollbar-width:thin] transition-[max-width] duration-300 ease-out',
          ataOpen ? 'sm:max-w-275' : 'sm:max-w-2xl'
        )}
        showCloseButton
      >
        <DialogDescription className="sr-only">Detalhes da audiência</DialogDescription>

        {/* ═══ COLUNA PRINCIPAL ═══ */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0',
            ataOpen && 'border-r border-border/50'
          )}
        >
          {/* HEADER · Capa do processo */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <DialogTitle className="flex-1 min-w-0 text-[16px] font-semibold text-foreground leading-[1.3] -tracking-[0.01em] truncate">
                {poloAtivo}
                <span className="mx-1.5 font-medium text-muted-foreground/70">×</span>
                {poloPassivo}
              </DialogTitle>
              {audiencia && <AudienciaStatusBadge status={audiencia.status} />}
            </div>

            {audiencia && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-muted-foreground">
                <span>{audiencia.numeroProcesso}</span>
                {audiencia.classeJudicialDescricao && (
                  <>
                    <MetaDot />
                    <span>{audiencia.classeJudicialDescricao}</span>
                  </>
                )}
                <MetaDot />
                <span>
                  {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                </span>
                {orgaoJulgador && (
                  <>
                    <MetaDot />
                    <span>{orgaoJulgador}</span>
                  </>
                )}
                {audiencia.dataAutuacao && (
                  <>
                    <MetaDot />
                    <span>
                      Autuado em{' '}
                      {format(parseISO(audiencia.dataAutuacao), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* BLOCO DA AUDIÊNCIA · meio */}
          {audiencia && !isLoading && !error && (
            <div className="shrink-0 mx-6 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-3 mb-3.5">
                <Gavel className="size-4.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold text-foreground leading-tight">
                    {audiencia.tipoDescricao || 'Audiência'}
                  </div>
                  {dataInicio && dataFim && (
                    <div className="text-[12.5px] text-muted-foreground mt-0.5 capitalize">
                      {format(dataInicio, "EEE, dd MMM yyyy", { locale: ptBR })}
                      {' · '}
                      <span className="tabular-nums">
                        {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pb-3.5 mb-3.5 border-b border-border/40">
                {/* Modalidade */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9.5px] font-semibold text-muted-foreground/75 uppercase tracking-[0.08em]">
                    Modalidade
                  </span>
                  <Popover open={modalidadePopoverOpen} onOpenChange={setModalidadePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={savingModalidade}
                        className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-card border border-border/60 text-[12.5px] font-medium text-foreground hover:bg-muted/60 hover:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        {savingModalidade ? (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {audiencia.modalidade &&
                              React.createElement(MODALIDADE_ICONS[audiencia.modalidade], {
                                className: 'size-3.5 text-primary',
                              })}
                            <span>
                              {audiencia.modalidade
                                ? MODALIDADE_LABELS[audiencia.modalidade]
                                : 'Definir'}
                            </span>
                            <ChevronDown className="size-3 text-muted-foreground opacity-60" />
                          </>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1.5 rounded-xl glass-dropdown" align="start">
                      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 pt-1 pb-1.5">
                        Modalidade
                      </p>
                      {(Object.values(ModalidadeAudiencia) as ModalidadeAudiencia[]).map((m) => {
                        const Icon = MODALIDADE_ICONS[m];
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleChangeModalidade(m)}
                            className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-[12px] hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <Icon className="size-3.5 text-muted-foreground" />
                            <span>{MODALIDADE_LABELS[m]}</span>
                            {audiencia.modalidade === m && (
                              <Check className="size-3 ml-auto text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Responsável */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9.5px] font-semibold text-muted-foreground/75 uppercase tracking-[0.08em]">
                    Responsável
                  </span>
                  <AudienciaResponsavelPopover
                    audienciaId={audiencia.id}
                    responsavelId={audiencia.responsavelId}
                    usuarios={usuarios}
                    onSuccess={() => onOpenChange(false)}
                  >
                    <ResponsavelTriggerContent
                      responsavelId={audiencia.responsavelId}
                      usuarios={usuarios}
                      size="md"
                    />
                  </AudienciaResponsavelPopover>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                {(isVirtual || isHibrida) && (
                  <Button
                    asChild={!!audiencia.urlAudienciaVirtual}
                    disabled={!audiencia.urlAudienciaVirtual}
                    size="sm"
                  >
                    {audiencia.urlAudienciaVirtual ? (
                      <a
                        href={audiencia.urlAudienciaVirtual}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Video className="size-4" />
                        Entrar na Sala Virtual
                      </a>
                    ) : (
                      <>
                        <Video className="size-4" />
                        Entrar na Sala Virtual
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild={isPje} disabled={!isPje}>
                  {isPje ? (
                    <a href={pjeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      Abrir no PJe
                    </a>
                  ) : (
                    <>
                      <ExternalLink className="size-4" />
                      Abrir no PJe
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* BODY scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {audiencia && !isLoading && !error && (
              <div className="space-y-4">
                {/* ATA · só quando existe */}
                {hasAta && (
                  <div>
                    <SectionHeader icon={FileText} label="Ata da Audiência" />
                    <button
                      type="button"
                      onClick={() => setAtaOpen((v) => !v)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/8 hover:bg-success/12 border border-success/25 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="w-8 h-8 rounded-lg bg-success/18 text-success inline-flex items-center justify-center shrink-0">
                        <FileText className="size-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-foreground">
                          Ata assinada · PDF
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">
                          Clique para {ataOpen ? 'fechar' : 'ler ao lado'}
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          'size-4 text-muted-foreground transition-transform',
                          ataOpen && 'rotate-90'
                        )}
                      />
                    </button>
                  </div>
                )}

                {/* LOCAL / ACESSO — condicional por modalidade */}
                <div>
                  <SectionHeader icon={Building2} label="Local / Acesso" />
                  <SectionCard>
                    {(isVirtual || isHibrida) && (
                      <div className={isHibrida ? 'mb-3 pb-3 border-b border-border/40' : ''}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                            Link da sala virtual
                          </span>
                          {!editingUrl && (
                            <button
                              type="button"
                              onClick={handleStartEditUrl}
                              className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Pencil className="size-2.5" />
                              {audiencia.urlAudienciaVirtual ? 'Editar' : 'Adicionar'}
                            </button>
                          )}
                        </div>
                        {editingUrl ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="url"
                              placeholder="https://..."
                              value={urlDraft}
                              onChange={(e) => setUrlDraft(e.target.value)}
                              className="h-8 text-xs flex-1"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 shrink-0"
                              onClick={handleSaveUrl}
                              disabled={savingUrl}
                            >
                              {savingUrl ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3.5 text-success" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 shrink-0"
                              onClick={() => setEditingUrl(false)}
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : audiencia.urlAudienciaVirtual ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="size-3.5 text-muted-foreground/60 shrink-0" />
                            <a
                              href={audiencia.urlAudienciaVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-primary truncate hover:underline"
                            >
                              {audiencia.urlAudienciaVirtual}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0"
                              onClick={() => handleCopyUrl(audiencia.urlAudienciaVirtual!)}
                            >
                              {copiedUrl ? (
                                <Check className="size-3.5 text-success" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground/60 italic">
                            Nenhum link cadastrado
                          </p>
                        )}
                      </div>
                    )}

                    {(isPresencial || isHibrida) && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                            Endereço presencial
                          </span>
                          {!editingEndereco && (
                            <button
                              type="button"
                              onClick={handleStartEditEndereco}
                              className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Pencil className="size-2.5" />
                              {audiencia.enderecoPresencial ? 'Editar' : 'Adicionar'}
                            </button>
                          )}
                        </div>
                        {editingEndereco ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_80px] gap-2">
                              <Input
                                placeholder="Logradouro"
                                value={enderecoDraft.logradouro}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, logradouro: e.target.value }))
                                }
                                className="h-8 text-xs"
                                autoFocus
                              />
                              <Input
                                placeholder="Nº"
                                value={enderecoDraft.numero}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, numero: e.target.value }))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Complemento"
                                value={enderecoDraft.complemento || ''}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, complemento: e.target.value }))
                                }
                                className="h-8 text-xs"
                              />
                              <Input
                                placeholder="Bairro"
                                value={enderecoDraft.bairro}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, bairro: e.target.value }))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-[1fr_60px_100px] gap-2">
                              <Input
                                placeholder="Cidade"
                                value={enderecoDraft.cidade}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, cidade: e.target.value }))
                                }
                                className="h-8 text-xs"
                              />
                              <Input
                                placeholder="UF"
                                maxLength={2}
                                value={enderecoDraft.uf}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({
                                    ...d,
                                    uf: e.target.value.toUpperCase(),
                                  }))
                                }
                                className="h-8 text-xs"
                              />
                              <Input
                                placeholder="CEP"
                                value={enderecoDraft.cep}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, cep: e.target.value }))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 mt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEndereco(false)}
                                className="h-7 text-xs"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEndereco}
                                disabled={savingEndereco}
                                className="h-7 text-xs"
                              >
                                {savingEndereco && (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                )}
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : audiencia.enderecoPresencial ? (
                          <p className="text-[13px] text-foreground/90 leading-relaxed">
                            {audiencia.enderecoPresencial.logradouro},{' '}
                            {audiencia.enderecoPresencial.numero}
                            {audiencia.enderecoPresencial.complemento &&
                              ` — ${audiencia.enderecoPresencial.complemento}`}
                            <br />
                            <span className="text-muted-foreground">
                              {audiencia.enderecoPresencial.bairro},{' '}
                              {audiencia.enderecoPresencial.cidade} —{' '}
                              {audiencia.enderecoPresencial.uf}
                              {audiencia.enderecoPresencial.cep &&
                                ` · CEP ${audiencia.enderecoPresencial.cep}`}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[13px] text-muted-foreground/60 italic">
                            Nenhum endereço cadastrado
                          </p>
                        )}
                      </div>
                    )}

                    {/* Híbrida: quem é presencial? */}
                    {isHibrida && (
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-2">
                          Quem participa presencialmente?
                        </span>
                        <div className="inline-flex gap-1 p-1 rounded-lg bg-muted/60 border border-border/40">
                          {(
                            [
                              { v: PresencaHibrida.Advogado, label: 'Advogados' },
                              { v: PresencaHibrida.Cliente, label: 'Clientes' },
                            ] as const
                          ).map(({ v, label }) => (
                            <button
                              key={v}
                              type="button"
                              disabled={savingPresenca}
                              onClick={() => handleChangePresencaHibrida(v)}
                              className={cn(
                                'px-3 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                                audiencia.presencaHibrida === v
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed">
                          Os demais participam por videoconferência.
                        </p>
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* INDICADORES */}
                {hasIndicadores && (
                  <div>
                    <SectionHeader icon={Clock} label="Indicadores" />
                    <SectionCard>
                      <AudienciaIndicadorBadges
                        audiencia={audiencia}
                        show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                      />
                    </SectionCard>
                  </div>
                )}

                {/* OBSERVAÇÕES — inline edit */}
                <div>
                  <SectionHeader
                    icon={MessageSquare}
                    label="Observações"
                    action={
                      !editingObs && (
                        <button
                          type="button"
                          onClick={handleStartEditObs}
                          className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Pencil className="size-2.5" />
                          {audiencia.observacoes ? 'Editar' : 'Adicionar'}
                        </button>
                      )
                    }
                  />
                  <SectionCard>
                    {editingObs ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Anotações sobre a audiência..."
                          value={obsDraft}
                          onChange={(e) => setObsDraft(e.target.value)}
                          rows={3}
                          className="text-[13px]"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingObs(false)}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveObs}
                            disabled={savingObs}
                            className="h-7 text-xs"
                          >
                            {savingObs && <Loader2 className="size-3 animate-spin mr-1" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : audiencia.observacoes ? (
                      <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {audiencia.observacoes}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground/60 italic">
                        Nenhuma observação registrada
                      </p>
                    )}
                  </SectionCard>
                </div>

                {/* HISTÓRICO */}
                <div>
                  <SectionHeader icon={Clock} label="Histórico de Alterações" />
                  <AudienciaTimeline audienciaId={audiencia.id} audiencia={audiencia} />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="shrink-0 px-6 py-3 border-t border-border/50 flex items-center justify-end bg-card/40">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>

        {/* ═══ COLUNA PDF (split view) ═══ */}
        {ataOpen && audiencia?.urlAtaAudiencia && (
          <aside className="w-1/2 shrink-0 flex flex-col bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                <FileText className="size-3.5 text-success" />
                Ata{' '}
                {dataInicio && (
                  <span className="text-muted-foreground font-medium">
                    · {format(dataInicio, 'dd MMM yyyy', { locale: ptBR })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-[11px]">
                  <a href={audiencia.urlAtaAudiencia} target="_blank" rel="noopener noreferrer">
                    Baixar
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setAtaOpen(false)}
                  aria-label="Fechar PDF"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={audiencia.urlAtaAudiencia}
                title="Ata da Audiência"
                className="w-full h-full border-0"
              />
            </div>
          </aside>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      className="inline-block w-0.75 h-0.75 rounded-full bg-muted-foreground/60"
    />
  );
}
