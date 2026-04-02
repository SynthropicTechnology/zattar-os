'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  CalendarDays,
  Clock,
  MapPin,
  User,
  ClipboardList,
  BookOpen,
  FileText,
  ShieldAlert,
  Monitor,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { ParteBadge } from '@/components/ui/parte-badge';
import { GRAU_TRIBUNAL_LABELS, StatusAudiencia, type Audiencia } from '../domain';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { actionBuscarAudienciaPorId } from '../actions';
import { useUsuarios } from '@/app/app/usuarios';

// =============================================================================
// SECTION COMPONENT - Padroniza as seções do sheet
// =============================================================================

interface DetailSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function DetailSection({ icon, title, children }: DetailSectionProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// INFO ROW COMPONENT
// =============================================================================

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground min-w-25 shrink-0">{label}:</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

// =============================================================================
// HELPER - Get initials
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
    if (!shouldFetch || !open) {
      return;
    }

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
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
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

  // =============================================================================
  // RENDER: Loading State
  // =============================================================================

  if (shouldFetch && isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-100 sm:w-135 flex flex-col bg-background">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="sr-only">Carregando</SheetTitle>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </SheetHeader>
          <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // =============================================================================
  // RENDER: Error State
  // =============================================================================

  if (shouldFetch && error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-100 sm:w-135 flex flex-col bg-background">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="sr-only">Erro</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center p-4">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle className="text-destructive" />
                </EmptyMedia>
                <EmptyTitle>Erro ao carregar audiência</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
          <SheetFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // =============================================================================
  // RENDER: Not Found State
  // =============================================================================

  if (!audiencia) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-100 sm:w-135 flex flex-col bg-background">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="sr-only">Não encontrada</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center p-4">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>Audiência não encontrada</EmptyTitle>
                <EmptyDescription>
                  Os detalhes desta audiência não puderam ser carregados.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
          <SheetFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // =============================================================================
  // RENDER: Main Content
  // =============================================================================

  const dataInicio = parseISO(audiencia.dataInicio);
  const dataFim = parseISO(audiencia.dataFim);
  const responsavelNome = getResponsavelNome(audiencia.responsavelId);
  const responsavelAvatar = audiencia.responsavelId
    ? usuarios.find((u) => u.id === audiencia.responsavelId)?.avatarUrl ?? null
    : null;

  // Verifica se a audiência tem ata disponível
  const hasAta = audiencia.ataAudienciaId || audiencia.urlAtaAudiencia;
  const isRealizada = audiencia.status === StatusAudiencia.Finalizada;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-100 sm:w-135 flex flex-col bg-background">
        {/* Header */}
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-heading font-bold truncate">
                {audiencia.tipoDescricao || 'Audiência'}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <CalendarDays className="h-4 w-4" />
                <span>{format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}</span>
                <Clock className="h-4 w-4 ml-1" />
                <span>
                  {format(dataInicio, 'HH:mm', { locale: ptBR })} -{' '}
                  {format(dataFim, 'HH:mm', { locale: ptBR })}
                </span>
              </SheetDescription>
            </div>
            <AudienciaStatusBadge status={audiencia.status} className="shrink-0" />
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ata de Audiência Section - Appears first if available */}
          {isRealizada && hasAta && (
            <DetailSection icon={<FileText className="h-4 w-4" />} title="Ata de Audiência">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  Ata Disponível
                </span>
                {audiencia.urlAtaAudiencia && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={audiencia.urlAtaAudiencia}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visualizar Ata
                    </a>
                  </Button>
                )}
              </div>
            </DetailSection>
          )}

          {/* Processo Section */}
          <DetailSection icon={<ClipboardList className="h-4 w-4" />} title="Processo">
            <InfoRow label="Número">
              <span className="font-mono font-medium">{audiencia.numeroProcesso}</span>
            </InfoRow>
            <InfoRow label="Tribunal">
              {audiencia.trt} - {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
            </InfoRow>
            <Separator className="my-2" />
            <div className="text-sm space-y-1.5">
              <ParteBadge polo="ATIVO" className="flex" truncate maxWidth="100%">
                {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '-'}
              </ParteBadge>
              <ParteBadge polo="PASSIVO" className="flex" truncate maxWidth="100%">
                {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '-'}
              </ParteBadge>
            </div>
          </DetailSection>

          {/* Local/Link Section */}
          <DetailSection icon={<MapPin className="h-4 w-4" />} title="Local / Link">
            <div className="flex items-center gap-2 flex-wrap">
              <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
              {audiencia.urlAudienciaVirtual && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={audiencia.urlAudienciaVirtual}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Entrar na Sala
                  </a>
                </Button>
              )}
            </div>
            {audiencia.salaAudienciaNome && (
              <InfoRow label="Sala">{audiencia.salaAudienciaNome}</InfoRow>
            )}
            {audiencia.enderecoPresencial && (
              <div className="text-sm text-muted-foreground mt-2">
                {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                {audiencia.enderecoPresencial.complemento && ` - ${audiencia.enderecoPresencial.complemento}`}
                <br />
                {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} -{' '}
                {audiencia.enderecoPresencial.uf}
                <br />
                CEP: {audiencia.enderecoPresencial.cep}
              </div>
            )}
          </DetailSection>

          {/* Responsável Section */}
          <DetailSection icon={<User className="h-4 w-4" />} title="Responsável">
            {audiencia.responsavelId && responsavelNome ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(responsavelNome)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{responsavelNome}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Sem responsável atribuído</span>
            )}
          </DetailSection>

          {/* Informações Adicionais Section */}
          {(audiencia.segredoJustica || audiencia.juizoDigital || audiencia.statusDescricao) && (
            <DetailSection icon={<Scale className="h-4 w-4" />} title="Informações Adicionais">
              {audiencia.statusDescricao && (
                <InfoRow label="Situação">{audiencia.statusDescricao}</InfoRow>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {audiencia.segredoJustica && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                    <ShieldAlert className="h-3 w-3" />
                    Segredo de Justiça
                  </span>
                )}
                {audiencia.juizoDigital && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                    <Monitor className="h-3 w-3" />
                    Juízo Digital
                  </span>
                )}
              </div>
            </DetailSection>
          )}

          {/* Observações Section */}
          {audiencia.observacoes && (
            <DetailSection icon={<BookOpen className="h-4 w-4" />} title="Observações">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {audiencia.observacoes}
              </p>
            </DetailSection>
          )}

          {/* Audit Info */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2">
            <p>
              Criado em: {format(parseISO(audiencia.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p>
              Atualizado em: {format(parseISO(audiencia.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
