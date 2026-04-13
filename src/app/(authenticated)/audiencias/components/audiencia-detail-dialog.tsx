'use client';

import * as React from 'react';
import {
  Gavel,
  Clock,
  ExternalLink,
  Copy,
  Pencil,
  MapPin,
  Video,
  FileText,
  Building2,
  Loader2,
  Check,
  AlertCircle,
  Scale,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Landmark,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconContainer } from '@/components/ui/icon-container';
import { ParteBadge } from '@/components/ui/parte-badge';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { PrepScore } from './prep-score';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
// EditarAudienciaDialog removido — edição agora é inline
import {
  type Audiencia,
  type EnderecoPresencial,
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
} from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

// =============================================================================
// HELPERS
// =============================================================================

// =============================================================================
// SECTION HEADER — ícone + label uppercase (padrão do POC)
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
    <div className="flex items-center justify-between mb-3">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
        <Icon className="size-3.5 text-muted-foreground/40" />
        {label}
      </h4>
      {action}
    </div>
  );
}

// =============================================================================
// SECTION CARD — glass-card-light (fundo opaco suave)
// =============================================================================

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] bg-muted/40 border border-border/[0.06] p-[18px_20px] ${className ?? ''}`}>
      {children}
    </div>
  );
}

// =============================================================================
// TYPES
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

  // ── Inline editing states ──
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

    return () => { cancelled = true; };
  }, [audienciaId, shouldFetch, open]);

  const audiencia = audienciaProp || fetchedAudiencia;
  const isPje = audiencia ? isAudienciaCapturada(audiencia) : false;
  const pjeUrl = audiencia ? buildPjeUrl(audiencia.trt, audiencia.numeroProcesso) : '';
  const hasAta = !!(audiencia?.urlAtaAudiencia);

  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const dataFim = audiencia ? parseISO(audiencia.dataFim) : null;


  const handleCopyUrl = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // silencioso
    }
  }, []);

  // ── Inline save handlers ──
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

  const hasIndicadores = audiencia && (
    audiencia.segredoJustica ||
    audiencia.juizoDigital ||
    audiencia.designada ||
    audiencia.documentoAtivo
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[780px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [scrollbar-width:thin]"
          showCloseButton
        >
          {/* ══ HEADER (fixo) ══ */}
          <div className="shrink-0" style={{ padding: '24px 28px 0' }}>
            {/* Título + Badge */}
            <div className="flex items-start gap-3.5 mb-4">
              <IconContainer size="lg" className="bg-primary/10 shrink-0 mt-0.5">
                <Gavel className="size-5 text-primary" />
              </IconContainer>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    {audiencia?.tipoDescricao || 'Audiência'}
                  </DialogTitle>
                  {audiencia && <AudienciaStatusBadge status={audiencia.status} />}
                </div>
                {dataInicio && (
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 capitalize">
                    {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {/* Meta strip — card opaco horizontal com separadores verticais */}
            {audiencia && !isLoading && !error && (
              <SectionCard className="flex gap-0 mb-4">
                {/* Horário */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Horário</span>
                  <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Clock className="size-3.5 text-muted-foreground/40" />
                    {dataInicio && dataFim && (
                      <span className="tabular-nums">
                        {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Modalidade */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Modalidade</span>
                  <div className="mt-1">
                    <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
                  </div>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Tribunal */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Tribunal</span>
                  <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Landmark className="size-3.5 text-muted-foreground/40" />
                    <span className="truncate">{TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}</span>
                  </span>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Responsável — inline popover */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Responsável</span>
                  <div className="mt-1">
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
              </SectionCard>
            )}

            {/* Botões de ação */}
            {audiencia && (
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                <Button
                  asChild={!!audiencia.urlAudienciaVirtual}
                  disabled={!audiencia.urlAudienciaVirtual}
                >
                  {audiencia.urlAudienciaVirtual ? (
                    <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer">
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

                {hasAta && (
                  <Button variant="outline" asChild>
                    <a href={audiencia.urlAtaAudiencia!} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-4" />
                      Visualizar Ata
                    </a>
                  </Button>
                )}

                <Button variant="outline" asChild={isPje} disabled={!isPje}>
                  {isPje ? (
                    <a href={pjeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      Abrir PJe
                    </a>
                  ) : (
                    <>
                      <ExternalLink className="size-4" />
                      Abrir PJe
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="h-px bg-border/20" />
          </div>

          {/* ══ BODY (scrollável) ══ */}
          <div className="flex-1 overflow-y-auto px-7 py-5 [scrollbar-width:thin]">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {audiencia && !isLoading && !error && (
              <div className="space-y-5">
                {/* ── Processo Vinculado ── */}
                <div>
                  <SectionHeader icon={ClipboardList} label="Processo Vinculado" />
                  <SectionCard>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-semibold text-foreground tabular-nums">
                          {audiencia.numeroProcesso}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-border/20 my-3" />
                    <div className="flex gap-6">
                      <div>
                        <ParteBadge polo="ATIVO" truncate maxWidth="250px">
                          {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloAtivoRepresentaVarios && (
                          <span className="text-[10px] text-muted-foreground ml-1">e outros</span>
                        )}
                      </div>
                      <div>
                        <ParteBadge polo="PASSIVO" truncate maxWidth="250px">
                          {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloPassivoRepresentaVarios && (
                          <span className="text-[10px] text-muted-foreground ml-1">e outros</span>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* ── Local / Acesso (sempre visível) ── */}
                <div>
                  <SectionHeader icon={Building2} label="Local / Acesso" />
                  <SectionCard>
                    <div className="space-y-3">
                      {/* URL Virtual — inline edit */}
                      {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em]">Sala Virtual</span>
                            {!editingUrl && (
                              <button type="button" onClick={handleStartEditUrl} className="text-[10px] text-primary/60 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5">
                                <Pencil className="size-2.5" />
                                {audiencia.urlAudienciaVirtual ? 'Editar' : 'Adicionar'}
                              </button>
                            )}
                          </div>
                          {editingUrl ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="url"
                                placeholder="https://zoom.us/..."
                                value={urlDraft}
                                onChange={(e) => setUrlDraft(e.target.value)}
                                className="h-8 text-xs flex-1"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleSaveUrl} disabled={savingUrl}>
                                {savingUrl ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5 text-success" />}
                              </Button>
                              <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => setEditingUrl(false)}>
                                <X className="size-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : audiencia.urlAudienciaVirtual ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <Video className="size-3.5 text-muted-foreground/40 shrink-0" />
                              <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary truncate hover:underline">
                                {audiencia.urlAudienciaVirtual}
                              </a>
                              <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => handleCopyUrl(audiencia.urlAudienciaVirtual!)}>
                                {copiedUrl ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-[13px] text-muted-foreground/40 italic">Nenhum link cadastrado</p>
                          )}
                        </div>
                      )}

                      {/* Endereço Presencial — inline edit */}
                      {(audiencia.modalidade === 'presencial' || audiencia.modalidade === 'hibrida') && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em]">Endereço</span>
                            {!editingEndereco && (
                              <button type="button" onClick={handleStartEditEndereco} className="text-[10px] text-primary/60 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5">
                                <Pencil className="size-2.5" />
                                {audiencia.enderecoPresencial ? 'Editar' : 'Adicionar'}
                              </button>
                            )}
                          </div>
                          {editingEndereco ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-[1fr_80px] gap-2">
                                <Input placeholder="Logradouro" value={enderecoDraft.logradouro} onChange={(e) => setEnderecoDraft((d) => ({ ...d, logradouro: e.target.value }))} className="h-8 text-xs" autoFocus />
                                <Input placeholder="Nº" value={enderecoDraft.numero} onChange={(e) => setEnderecoDraft((d) => ({ ...d, numero: e.target.value }))} className="h-8 text-xs" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Complemento" value={enderecoDraft.complemento || ''} onChange={(e) => setEnderecoDraft((d) => ({ ...d, complemento: e.target.value }))} className="h-8 text-xs" />
                                <Input placeholder="Bairro" value={enderecoDraft.bairro} onChange={(e) => setEnderecoDraft((d) => ({ ...d, bairro: e.target.value }))} className="h-8 text-xs" />
                              </div>
                              <div className="grid grid-cols-[1fr_60px_100px] gap-2">
                                <Input placeholder="Cidade" value={enderecoDraft.cidade} onChange={(e) => setEnderecoDraft((d) => ({ ...d, cidade: e.target.value }))} className="h-8 text-xs" />
                                <Input placeholder="UF" maxLength={2} value={enderecoDraft.uf} onChange={(e) => setEnderecoDraft((d) => ({ ...d, uf: e.target.value.toUpperCase() }))} className="h-8 text-xs" />
                                <Input placeholder="CEP" value={enderecoDraft.cep} onChange={(e) => setEnderecoDraft((d) => ({ ...d, cep: e.target.value }))} className="h-8 text-xs" />
                              </div>
                              <div className="flex justify-end gap-1.5 mt-1">
                                <Button size="sm" variant="ghost" onClick={() => setEditingEndereco(false)} className="h-7 text-xs">Cancelar</Button>
                                <Button size="sm" onClick={handleSaveEndereco} disabled={savingEndereco} className="h-7 text-xs">
                                  {savingEndereco ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : audiencia.enderecoPresencial ? (
                            <div className="flex items-start gap-2">
                              <MapPin className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                              <p className="text-[13px] text-foreground/80 leading-relaxed">
                                {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                                {audiencia.enderecoPresencial.complemento && ` – ${audiencia.enderecoPresencial.complemento}`}
                                <br />
                                <span className="text-muted-foreground">
                                  {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} – {audiencia.enderecoPresencial.uf}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-[13px] text-muted-foreground/40 italic">Nenhum endereço cadastrado</p>
                          )}
                        </div>
                      )}

                      {audiencia.presencaHibrida !== null && (
                        <AudienciaIndicadorBadges
                          audiencia={audiencia}
                          show={['presenca_hibrida']}
                          showPresencaDetail
                        />
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* ── Indicadores ── */}
                {hasIndicadores && (
                  <div>
                    <SectionHeader icon={Scale} label="Indicadores" />
                    <SectionCard>
                      <AudienciaIndicadorBadges
                        audiencia={audiencia}
                        show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                      />
                    </SectionCard>
                  </div>
                )}

                {/* ── Preparo ── */}
                <div>
                  <SectionHeader icon={ShieldCheck} label="Preparo" />
                  <SectionCard>
                    <PrepScore audiencia={audiencia} showBreakdown size="lg" />
                  </SectionCard>
                </div>

                {/* ── Observações (sempre visível, inline edit) ── */}
                <div>
                  <SectionHeader
                    icon={MessageSquare}
                    label="Observações"
                    action={
                      !editingObs && (
                        <button type="button" onClick={handleStartEditObs} className="text-[10px] text-primary/60 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5">
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
                          <Button size="sm" variant="ghost" onClick={() => setEditingObs(false)} className="h-7 text-xs">Cancelar</Button>
                          <Button size="sm" onClick={handleSaveObs} disabled={savingObs} className="h-7 text-xs">
                            {savingObs ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : audiencia.observacoes ? (
                      <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {audiencia.observacoes}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground/40 italic">Nenhuma observação</p>
                    )}
                  </SectionCard>
                </div>

                {/* ── Histórico ── */}
                <div>
                  <SectionHeader icon={Clock} label="Histórico de Alterações" />
                  <AudienciaTimeline audienciaId={audiencia.id} audiencia={audiencia} />
                </div>
              </div>
            )}
          </div>

          {/* ══ FOOTER (fixo) ══ */}
          <div className="shrink-0 px-7 py-4 border-t border-border/20 flex items-center justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
