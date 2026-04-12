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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconContainer } from '@/components/ui/icon-container';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ParteBadge } from '@/components/ui/parte-badge';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { PrepScore } from './prep-score';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { EditarAudienciaDialog } from './editar-audiencia-dialog';
import { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';
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
  const [isAlterarResponsavelOpen, setIsAlterarResponsavelOpen] = React.useState(false);
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

  const getResponsavelNome = React.useCallback(
    (responsavelId: number | null | undefined) => {
      if (!responsavelId) return null;
      const usuario = usuarios.find((u) => u.id === responsavelId);
      return usuario?.nomeExibicao || usuario?.nomeCompleto || `Usuário ${responsavelId}`;
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
      // silencioso
    }
  }, []);

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
          className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [scrollbar-width:thin]"
          showCloseButton
        >
          {/* ── HEADER ── */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/20">
            <div className="flex items-start gap-3">
              <IconContainer size="md" className="bg-primary/10 shrink-0">
                <Gavel className="size-4 text-primary" />
              </IconContainer>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-card-title truncate">
                    {audiencia?.tipoDescricao || 'Audiência'}
                  </DialogTitle>
                  {audiencia && <AudienciaStatusBadge status={audiencia.status} />}
                </div>
                {dataInicio && (
                  <p className="text-widget-sub mt-0.5 capitalize">
                    {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {/* Ações */}
            {audiencia && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  asChild={!!audiencia.urlAudienciaVirtual}
                  disabled={!audiencia.urlAudienciaVirtual}
                >
                  {audiencia.urlAudienciaVirtual ? (
                    <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer">
                      <Video className="size-3" />
                      Sala Virtual
                      <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    <>
                      <Video className="size-3" />
                      Sala Virtual
                    </>
                  )}
                </Button>

                {hasAta && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <a href={audiencia.urlAtaAudiencia!} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-3" />
                      Ata
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  asChild={isPje}
                  disabled={!isPje}
                >
                  {isPje ? (
                    <a href={pjeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                      PJe
                    </a>
                  ) : (
                    <>
                      <ExternalLink className="size-3" />
                      PJe
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 [scrollbar-width:thin]">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <AlertCircle className="size-5 text-destructive" />
                <p className="text-caption text-destructive">{error}</p>
              </div>
            )}

            {audiencia && !isLoading && !error && (
              <>
                {/* Meta grid — compact 2x2 */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <div className="text-meta-label mb-0.5">Horário</div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground/50" />
                      {dataInicio && dataFim && (
                        <span className="text-label tabular-nums">
                          {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-meta-label mb-0.5">Modalidade</div>
                    <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
                  </div>

                  <div>
                    <div className="text-meta-label mb-0.5">Tribunal</div>
                    <span className="text-label truncate block">
                      {TRT_NOMES[audiencia.trt] || audiencia.trt}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        Responsável
                      </span>
                      <button
                        onClick={() => setIsAlterarResponsavelOpen(true)}
                        className="text-[10px] text-primary/60 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Pencil className="size-2.5" />
                        Alterar
                      </button>
                    </div>
                    {audiencia.responsavelId && responsavelNome ? (
                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        <Avatar size="xs">
                          <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(responsavelNome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-label truncate">{responsavelNome}</span>
                      </div>
                    ) : (
                      <span className="text-caption mt-0.5">—</span>
                    )}
                  </div>
                </div>

                {/* Separador */}
                <div className="h-px bg-border/20" />

                {/* Processo */}
                <div>
                  <div className="text-meta-label mb-1">Processo</div>
                  <div className="font-mono text-label font-semibold tabular-nums tracking-tight">
                    {audiencia.numeroProcesso}
                  </div>
                  <div className="text-micro-caption mt-0.5">
                    {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ParteBadge polo="ATIVO" className="flex shrink-0" truncate maxWidth="100%">
                        {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—'}
                      </ParteBadge>
                      {audiencia.poloAtivoRepresentaVarios && (
                        <span className="text-micro-caption shrink-0">e outros</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ParteBadge polo="PASSIVO" className="flex shrink-0" truncate maxWidth="100%">
                        {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—'}
                      </ParteBadge>
                      {audiencia.poloPassivoRepresentaVarios && (
                        <span className="text-micro-caption shrink-0">e outros</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Local / Acesso */}
                {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida' || audiencia.modalidade === 'presencial') && (
                  audiencia.urlAudienciaVirtual || audiencia.enderecoPresencial
                ) && (
                  <>
                    <div className="h-px bg-border/20" />
                    <div>
                      <div className="text-meta-label mb-1">Local / Acesso</div>
                      <div className="space-y-2">
                        {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && audiencia.urlAudienciaVirtual && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="size-3.5 text-muted-foreground/50 shrink-0" />
                            <a
                              href={audiencia.urlAudienciaVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-label text-primary truncate hover:underline"
                            >
                              {audiencia.urlAudienciaVirtual}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0"
                              onClick={() => handleCopyUrl(audiencia.urlAudienciaVirtual!)}
                            >
                              {copiedUrl ? (
                                <Check className="size-3 text-success" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {(audiencia.modalidade === 'presencial' || audiencia.modalidade === 'hibrida') && audiencia.enderecoPresencial && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <p className="text-label leading-relaxed">
                              {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                              {audiencia.enderecoPresencial.complemento && ` – ${audiencia.enderecoPresencial.complemento}`}
                              <br />
                              <span className="text-caption">
                                {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} – {audiencia.enderecoPresencial.uf}
                              </span>
                            </p>
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
                    </div>
                  </>
                )}

                {/* Indicadores (só se houver) */}
                {hasIndicadores && (
                  <>
                    <div className="h-px bg-border/20" />
                    <div>
                      <div className="text-meta-label mb-1">Indicadores</div>
                      <AudienciaIndicadorBadges
                        audiencia={audiencia}
                        show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                      />
                    </div>
                  </>
                )}

                {/* Preparo */}
                <div className="h-px bg-border/20" />
                <div>
                  <div className="text-meta-label mb-1">Preparo</div>
                  <PrepScore audiencia={audiencia} showBreakdown size="lg" />
                </div>

                {/* Observações */}
                {audiencia.observacoes && (
                  <>
                    <div className="h-px bg-border/20" />
                    <div>
                      <div className="text-meta-label mb-1">Observações</div>
                      <p className="text-caption whitespace-pre-wrap leading-relaxed">
                        {audiencia.observacoes}
                      </p>
                    </div>
                  </>
                )}

                {/* Histórico */}
                <div className="h-px bg-border/20" />
                <div>
                  <div className="text-meta-label mb-1">Histórico</div>
                  <AudienciaTimeline audienciaId={audiencia.id} audiencia={audiencia} />
                </div>
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="shrink-0 px-6 py-3.5 border-t border-border/20 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {audiencia && (
              <Button size="sm" onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="size-3.5" />
                Editar
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

      {audiencia && (
        <AudienciasAlterarResponsavelDialog
          open={isAlterarResponsavelOpen}
          onOpenChange={setIsAlterarResponsavelOpen}
          audiencia={audiencia}
          usuarios={usuarios}
          onSuccess={() => {
            setIsAlterarResponsavelOpen(false);
          }}
        />
      )}
    </>
  );
}
