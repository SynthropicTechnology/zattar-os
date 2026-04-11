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
  ClipboardList,
  Building2,
  Scale,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ParteBadge } from '@/components/ui/parte-badge';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { PrepScore } from './prep-score';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { EditarAudienciaDialog } from './editar-audiencia-dialog';
import {
  type Audiencia,
  GRAU_TRIBUNAL_LABELS,
  TRT_NOMES,
  isAudienciaCapturada,
  buildPjeUrl,
} from '../domain';
import { actionBuscarAudienciaPorId } from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

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
          setError(result.error || 'Erro ao buscar audiencia');
        } else {
          setError('Audiencia nao encontrada');
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

  // Derived data
  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const dataFim = audiencia ? parseISO(audiencia.dataFim) : null;

  const getResponsavelNome = React.useCallback(
    (responsavelId: number | null | undefined) => {
      if (!responsavelId) return null;
      const usuario = usuarios.find((u) => u.id === responsavelId);
      return usuario?.nomeExibicao || usuario?.nomeCompleto || `Usuario ${responsavelId}`;
    },
    [usuarios],
  );

  const responsavelNome = audiencia ? getResponsavelNome(audiencia.responsavelId) : null;
  const responsavelAvatar = audiencia?.responsavelId
    ? usuarios.find((u) => u.id === audiencia.responsavelId)?.avatarUrl ?? null
    : null;

  const handleCopyUrl = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback silencioso
    }
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [scrollbar-width:thin]"
          showCloseButton
        >
          {/* ── HEADER (fixo) ── */}
          <div className="flex-shrink-0 px-7 pt-6 pb-4 border-b border-border/20">
            {/* Linha 1: icone + titulo + status badge */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Gavel className="size-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold leading-tight truncate">
                    {audiencia?.tipoDescricao || 'Audiencia'}
                  </h2>
                  {audiencia && <AudienciaStatusBadge status={audiencia.status} />}
                </div>
                {/* Linha 2: data por extenso */}
                {dataInicio && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {/* Linha 3: botoes de acao */}
            {audiencia && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  asChild={!!audiencia.urlAudienciaVirtual}
                  disabled={!audiencia.urlAudienciaVirtual}
                >
                  {audiencia.urlAudienciaVirtual ? (
                    <a
                      href={audiencia.urlAudienciaVirtual}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="size-3.5" />
                      Entrar na Sala Virtual
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <>
                      <Video className="size-3.5" />
                      Entrar na Sala Virtual
                    </>
                  )}
                </Button>

                {hasAta && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={audiencia.urlAtaAudiencia!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="size-3.5" />
                      Visualizar Ata
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  asChild={isPje}
                  disabled={!isPje}
                >
                  {isPje ? (
                    <a
                      href={pjeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3.5" />
                      Abrir PJe
                    </a>
                  ) : (
                    <>
                      <ExternalLink className="size-3.5" />
                      Abrir PJe
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ── BODY (scrollavel) ── */}
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-3.5">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Conteudo principal */}
            {audiencia && !isLoading && !error && (
              <>
                {/* 1. Meta strip */}
                <GlassPanel depth={1} className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Horario */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        Horario
                      </span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="size-3.5 text-muted-foreground/50" />
                        {dataInicio && dataFim && (
                          <span className="tabular-nums">
                            {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Modalidade */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        Modalidade
                      </span>
                      <div>
                        <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
                      </div>
                    </div>

                    {/* TRT/Grau */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        TRT / Grau
                      </span>
                      <p className="text-sm truncate">
                        {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                      </p>
                    </div>

                    {/* Responsavel */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        Responsavel
                      </span>
                      {audiencia.responsavelId && responsavelNome ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar size="xs">
                            <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
                            <AvatarFallback className="text-[9px]">
                              {getInitials(responsavelNome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{responsavelNome}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </div>
                </GlassPanel>

                {/* 2. Processo */}
                <GlassPanel depth={1} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Processo</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="space-y-0.5">
                      <span className="block font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                        {audiencia.numeroProcesso}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/60">
                        {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ParteBadge polo="ATIVO" className="flex shrink-0" truncate maxWidth="100%">
                          {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloAtivoRepresentaVarios && (
                          <span className="text-muted-foreground text-xs shrink-0">e outros</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ParteBadge polo="PASSIVO" className="flex shrink-0" truncate maxWidth="100%">
                          {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloPassivoRepresentaVarios && (
                          <span className="text-muted-foreground text-xs shrink-0">e outros</span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassPanel>

                {/* 3. Local/Acesso */}
                {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida' || audiencia.modalidade === 'presencial') && (
                  <GlassPanel depth={1} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="size-3.5 text-muted-foreground/50" />
                      <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Local / Acesso</span>
                    </div>
                    <div className="space-y-3">
                      {/* URL Virtual */}
                      {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && audiencia.urlAudienciaVirtual && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground/60">Sala Virtual</span>
                          <div className="flex items-center gap-2">
                            <a
                              href={audiencia.urlAudienciaVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary truncate hover:underline"
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
                        </div>
                      )}

                      {/* Endereco presencial */}
                      {(audiencia.modalidade === 'presencial' || audiencia.modalidade === 'hibrida') && audiencia.enderecoPresencial && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground/60">Endereco Presencial</span>
                          <div className="flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                              {audiencia.enderecoPresencial.complemento && ` – ${audiencia.enderecoPresencial.complemento}`}
                              <br />
                              {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} – {audiencia.enderecoPresencial.uf}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Presenca hibrida badge */}
                      {audiencia.presencaHibrida !== null && (
                        <AudienciaIndicadorBadges
                          audiencia={audiencia}
                          show={['presenca_hibrida']}
                          showPresencaDetail
                        />
                      )}
                    </div>
                  </GlassPanel>
                )}

                {/* 4. Indicadores */}
                <GlassPanel depth={1} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Indicadores</span>
                  </div>
                  <AudienciaIndicadorBadges
                    audiencia={audiencia}
                    show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                  />
                  {/* Fallback quando nenhum indicador ativo */}
                  {!audiencia.segredoJustica &&
                    !audiencia.juizoDigital &&
                    !audiencia.designada &&
                    !audiencia.documentoAtivo && (
                      <p className="text-sm text-muted-foreground/60">Nenhum indicador especial</p>
                    )}
                </GlassPanel>

                {/* 5. Preparo */}
                <GlassPanel depth={1} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Preparo</span>
                  </div>
                  <PrepScore
                    audiencia={audiencia}
                    showBreakdown
                    size="lg"
                  />
                </GlassPanel>

                {/* 6. Observacoes (condicional) */}
                {audiencia.observacoes && (
                  <GlassPanel depth={1} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="size-3.5 text-muted-foreground/50" />
                      <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Observacoes</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {audiencia.observacoes}
                    </p>
                  </GlassPanel>
                )}

                {/* 7. Historico de Alteracoes */}
                <GlassPanel depth={1} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Historico de Alteracoes</span>
                  </div>
                  <AudienciaTimeline
                    audienciaId={audiencia.id}
                    audiencia={audiencia}
                  />
                </GlassPanel>
              </>
            )}
          </div>

          {/* ── FOOTER (fixo) ── */}
          <div className="flex-shrink-0 px-7 py-4 border-t border-border/20 flex items-center justify-between bg-muted/30">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {audiencia && (
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="size-4" />
                Editar Audiencia
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {audiencia && (
        <EditarAudienciaDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            onOpenChange(false);
          }}
          audiencia={audiencia}
        />
      )}
    </>
  );
}
