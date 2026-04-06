'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  ClipboardList,
  BookOpen,
  FileText,
  ShieldAlert,
  Monitor,
  Scale,
  Video,
  Gavel,
  Clock,
  Building2,
} from 'lucide-react';
import { ParteBadge } from '@/components/ui/parte-badge';
import { GRAU_TRIBUNAL_LABELS, StatusAudiencia, type Audiencia } from '../domain';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { actionBuscarAudienciaPorId } from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetSeparator,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
} from '@/components/shared/detail-sheet';

// =============================================================================
// HELPER
// =============================================================================

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface AudienciaDetailSheetProps {
  audienciaId?: number;
  audiencia?: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AudienciaDetailSheet({
  audienciaId,
  audiencia: audienciaProp,
  open,
  onOpenChange,
}: AudienciaDetailSheetProps) {
  const [fetchedAudiencia, setFetchedAudiencia] = React.useState<Audiencia | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const getResponsavelNome = React.useCallback(
    (responsavelId: number | null | undefined) => {
      if (!responsavelId) return null;
      const usuario = usuarios.find((u) => u.id === responsavelId);
      return usuario?.nomeExibicao || usuario?.nomeCompleto || `Usuário ${responsavelId}`;
    },
    [usuarios]
  );

  // ─── Estado vazio ───
  if (!audiencia && !isLoading && !error) {
    return (
      <DetailSheet open={open} onOpenChange={onOpenChange}>
        <DetailSheetHeader>
          <DetailSheetTitle>Audiência</DetailSheetTitle>
        </DetailSheetHeader>
        <DetailSheetEmpty
          title="Audiência não encontrada"
          description="Os detalhes desta audiência não puderam ser carregados."
        />
        <DetailSheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DetailSheetFooter>
      </DetailSheet>
    );
  }

  // ─── Dados derivados ───
  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const dataFim = audiencia ? parseISO(audiencia.dataFim) : null;
  const responsavelNome = audiencia ? getResponsavelNome(audiencia.responsavelId) : null;
  const responsavelAvatar = audiencia?.responsavelId
    ? usuarios.find((u) => u.id === audiencia.responsavelId)?.avatarUrl ?? null
    : null;
  const hasAta = audiencia?.ataAudienciaId || audiencia?.urlAtaAudiencia;
  const isRealizada = audiencia?.status === StatusAudiencia.Finalizada;

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      loading={shouldFetch && isLoading}
      error={shouldFetch ? error : null}
    >
      {/* ─── Header ─── */}
      <DetailSheetHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gavel className="size-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DetailSheetTitle badge={audiencia && <AudienciaStatusBadge status={audiencia.status} />}>
              {audiencia?.tipoDescricao || 'Audiência'}
            </DetailSheetTitle>
            {dataInicio && (
              <DetailSheetDescription>
                {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DetailSheetDescription>
            )}
          </div>
        </div>
      </DetailSheetHeader>

      {/* ─── Conteúdo ─── */}
      <DetailSheetContent>
        {/* Meta strip — scan rápido */}
        {audiencia && (
          <DetailSheetMetaGrid className="rounded-xl border border-border/30 bg-muted/30 p-4">
            <DetailSheetMetaItem label="Horário">
              <Clock className="size-3.5 text-muted-foreground/50" />
              {dataInicio && dataFim && (
                <span className="tabular-nums">
                  {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                </span>
              )}
            </DetailSheetMetaItem>
            <DetailSheetMetaItem label="Modalidade">
              <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
            </DetailSheetMetaItem>
            <DetailSheetMetaItem label="Responsável">
              {audiencia.responsavelId && responsavelNome ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar size="xs">
                    <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(responsavelNome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{responsavelNome}</span>
                </div>
              ) : (
                <span className="text-muted-foreground/60">—</span>
              )}
            </DetailSheetMetaItem>
          </DetailSheetMetaGrid>
        )}

        {/* CTAs primários */}
        {audiencia && (audiencia.urlAudienciaVirtual || (isRealizada && hasAta)) && (
          <div className="flex flex-wrap gap-2">
            {audiencia.urlAudienciaVirtual && (
              <Button size="sm" asChild>
                <a
                  href={audiencia.urlAudienciaVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="size-3.5" />
                  Entrar na Sala Virtual
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            )}
            {isRealizada && hasAta && audiencia.urlAtaAudiencia && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={audiencia.urlAtaAudiencia}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="size-3.5" />
                  Visualizar Ata
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Processo */}
        {audiencia && (
          <DetailSheetSection icon={<ClipboardList className="size-3.5 text-muted-foreground/50" />} title="Processo">
            <div className="space-y-0.5">
              <span className="block font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                {audiencia.numeroProcesso}
              </span>
              <span className="block text-[11px] text-muted-foreground/60">
                {audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
              </span>
            </div>
            <DetailSheetSeparator />
            <div className="space-y-1.5">
              <ParteBadge polo="ATIVO" className="flex" truncate maxWidth="100%">
                {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—'}
              </ParteBadge>
              <ParteBadge polo="PASSIVO" className="flex" truncate maxWidth="100%">
                {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—'}
              </ParteBadge>
            </div>
          </DetailSheetSection>
        )}

        {/* Local / Endereço */}
        {audiencia && (audiencia.salaAudienciaNome || audiencia.enderecoPresencial) && (
          <DetailSheetSection icon={<Building2 className="size-3.5 text-muted-foreground/50" />} title="Local">
            {audiencia.salaAudienciaNome && (
              <DetailSheetInfoRow label="Sala">{audiencia.salaAudienciaNome}</DetailSheetInfoRow>
            )}
            {audiencia.enderecoPresencial && (
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                {audiencia.enderecoPresencial.complemento && ` – ${audiencia.enderecoPresencial.complemento}`}
                <br />
                {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} – {audiencia.enderecoPresencial.uf}
                <br />
                CEP: {audiencia.enderecoPresencial.cep}
              </p>
            )}
          </DetailSheetSection>
        )}

        {/* Flags */}
        {audiencia && (audiencia.segredoJustica || audiencia.juizoDigital || audiencia.statusDescricao) && (
          <DetailSheetSection icon={<Scale className="size-3.5 text-muted-foreground/50" />} title="Informações Adicionais">
            {audiencia.statusDescricao && (
              <DetailSheetInfoRow label="Situação">{audiencia.statusDescricao}</DetailSheetInfoRow>
            )}
            <div className="flex flex-wrap gap-2">
              {audiencia.segredoJustica && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                  <ShieldAlert className="size-3" />
                  Segredo de Justiça
                </span>
              )}
              {audiencia.juizoDigital && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info">
                  <Monitor className="size-3" />
                  Juízo Digital
                </span>
              )}
            </div>
          </DetailSheetSection>
        )}

        {/* Observações */}
        {audiencia?.observacoes && (
          <DetailSheetSection icon={<BookOpen className="size-3.5 text-muted-foreground/50" />} title="Observações">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {audiencia.observacoes}
            </p>
          </DetailSheetSection>
        )}

        {/* Audit */}
        {audiencia && (
          <DetailSheetAudit
            createdAt={audiencia.createdAt}
            updatedAt={audiencia.updatedAt}
          />
        )}
      </DetailSheetContent>

      {/* Footer */}
      <DetailSheetFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
