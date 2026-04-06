'use client';

import { useEffect, useState, useMemo } from 'react';
import { Eye, FileText, Calendar, Microscope, ExternalLink, Video, Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionObterDetalhesComplementaresProcesso } from '../actions';
import { Text } from '@/components/ui/typography';
import { ExpedienteVisualizarDialog } from '@/app/(authenticated)/expedientes/components/expediente-visualizar-dialog';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import { actionListarTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
} from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';
import { SITUACAO_PERICIA_LABELS, type SituacaoPericiaCodigo } from '@/app/(authenticated)/pericias';

interface UsuarioInfo {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface TipoExpedienteInfo {
  id: number;
  tipoExpediente: string;
}

interface ProcessoDetailsTabsProps {
  processoId: number;
  numeroProcesso: string;
  /** Mapa de usuários pré-carregado (evita fetch duplicado se fornecido) */
  usuariosMap?: Map<number, UsuarioInfo>;
}

function formatarData(data: string | null | undefined): string {
  if (!data) return '--';
  try {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '--';
  }
}

function formatarDataHora(data: string | null | undefined): string {
  if (!data) return '--';
  try {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '--';
  }
}

function formatarDataRelativa(data: string | null | undefined): string | null {
  if (!data) return null;
  try {
    return formatDistanceToNow(new Date(data), { locale: ptBR, addSuffix: true });
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function ResponsavelAvatar({ usuario }: { usuario?: UsuarioInfo }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className="h-7 w-7 border">
            <AvatarImage src={usuario?.avatarUrl || undefined} alt={usuario?.nomeExibicao || 'Não atribuído'} />
            <AvatarFallback className="text-[10px] font-medium">
              {usuario ? getInitials(usuario.nomeExibicao) : 'NA'}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          {usuario?.nomeExibicao || 'Sem responsável'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Status Badges ──────────────────────────────────────────────────────────

function StatusAudienciaBadge({ status }: { status: StatusAudiencia }) {
  const label = STATUS_AUDIENCIA_LABELS[status] || status;

  return (
    <SemanticBadge category="audiencia_status" value={status} className="text-xs">
      {label}
    </SemanticBadge>
  );
}

function StatusExpedienteBadge({ expediente }: { expediente: Expediente }) {
  if (expediente.baixadoEm) {
    return (
      <SemanticBadge category="status" value="respondido" variantOverride="success" toneOverride="soft" className="text-xs">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        Respondido
      </SemanticBadge>
    );
  }

  if (expediente.dataPrazoLegalParte && expediente.prazoVencido) {
    return (
      <SemanticBadge category="status" value="vencido" variantOverride="destructive" toneOverride="soft" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-0.5" />
        Vencido
      </SemanticBadge>
    );
  }

  if (expediente.dataPrazoLegalParte) {
    const relativa = formatarDataRelativa(expediente.dataPrazoLegalParte);
    return (
      <SemanticBadge category="status" value="no-prazo" variantOverride="warning" toneOverride="soft" className="text-xs">
        <Clock className="h-3 w-3 mr-0.5" />
        {relativa || 'No prazo'}
      </SemanticBadge>
    );
  }

  return null;
}

function SituacaoPericiaBadge({ codigo }: { codigo: SituacaoPericiaCodigo }) {
  const label = SITUACAO_PERICIA_LABELS[codigo] || codigo;
  return <SemanticBadge category="status" value={codigo} variantOverride="outline" className="text-xs">{label}</SemanticBadge>;
}

// ─── Tabelas ────────────────────────────────────────────────────────────────

function AudienciasTable({ audiencias }: { audiencias: Audiencia[] }) {
  const sorted = useMemo(
    () =>
      [...audiencias].sort(
        (a, b) =>
          new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime()
      ),
    [audiencias]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhuma audiência encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((aud) => (
        <div
          key={aud.id}
          className="rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">
                  {aud.tipoDescricao || 'Audiência'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatarDataHora(aud.dataInicio)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {aud.salaAudienciaNome && <span>Sala {aud.salaAudienciaNome}</span>}
                {aud.modalidade && (
                  <span>{MODALIDADE_AUDIENCIA_LABELS[aud.modalidade]}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <StatusAudienciaBadge status={aud.status} />
              {aud.urlAudienciaVirtual && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => window.open(aud.urlAudienciaVirtual!, '_blank')}
                      >
                        <Video className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Abrir sala virtual</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {aud.urlAtaAudiencia && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => window.open(aud.urlAtaAudiencia!, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver ata da audiência</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpedientesTable({
  expedientes,
  usuariosMap,
  tiposMap,
}: {
  expedientes: Expediente[];
  usuariosMap: Map<number, UsuarioInfo>;
  tiposMap: Map<number, TipoExpedienteInfo>;
}) {
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const sorted = useMemo(
    () =>
      [...expedientes].sort((a, b) => {
        const dateA = a.dataCriacaoExpediente
          ? new Date(a.dataCriacaoExpediente).getTime()
          : 0;
        const dateB = b.dataCriacaoExpediente
          ? new Date(b.dataCriacaoExpediente).getTime()
          : 0;
        return dateB - dateA;
      }),
    [expedientes]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhum expediente encontrado para este processo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((exp) => {
        const vencido =
          !!exp.dataPrazoLegalParte && !exp.baixadoEm && exp.prazoVencido;
        const responsavel = exp.responsavelId ? usuariosMap.get(exp.responsavelId) : undefined;
        const tipoLabel = exp.tipoExpedienteId
          ? tiposMap.get(exp.tipoExpedienteId)?.tipoExpediente || 'Tipo de expediente não informado'
          : 'Sem tipo definido';
        const statusBadge = <StatusExpedienteBadge expediente={exp} />;

        return (
          <div
            key={exp.id}
            className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 ${vencido ? 'border-destructive/30 bg-destructive/5' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{tipoLabel}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>Criado em {formatarData(exp.dataCriacaoExpediente)}</span>
                  {exp.dataCienciaParte && (
                    <span>Ciência em {formatarData(exp.dataCienciaParte)}</span>
                  )}
                  {exp.baixadoEm ? (
                    <span>Respondido em {formatarData(exp.baixadoEm)}</span>
                  ) : exp.dataPrazoLegalParte ? (
                    <span>Prazo em {formatarData(exp.dataPrazoLegalParte)}</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Text variant="meta-label">
                      Responsável
                    </Text>
                    <ResponsavelAvatar usuario={responsavel} />
                  </div>

                  {statusBadge}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setSelectedExpediente(exp)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver expediente</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {exp.arquivoUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => window.open(exp.arquivoUrl!, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Abrir documento do expediente</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {selectedExpediente && (
        <ExpedienteVisualizarDialog
          expediente={selectedExpediente}
          open={!!selectedExpediente}
          onOpenChange={(open) => {
            if (!open) setSelectedExpediente(null);
          }}
        />
      )}
    </div>
  );
}

function PericiasTable({ pericias }: { pericias: Pericia[] }) {
  const sorted = useMemo(
    () =>
      [...pericias].sort(
        (a, b) =>
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      ),
    [pericias]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhuma perícia encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((per) => (
        <div
          key={per.id}
          className="rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">
                  {per.especialidade?.descricao || 'Perícia'}
                </p>
                <SituacaoPericiaBadge codigo={per.situacaoCodigo} />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {per.perito?.nome && <span>Perito: {per.perito.nome}</span>}
                <span>Prazo: {formatarData(per.prazoEntrega)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {per.laudoJuntado ? (
                <SemanticBadge category="status" value="juntado" variantOverride="success" toneOverride="soft" className="text-xs">
                  Laudo Juntado
                </SemanticBadge>
              ) : (
                <span className="text-muted-foreground text-xs">Laudo Pendente</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProcessoDetailsTabs({
  processoId,
  numeroProcesso,
  usuariosMap: usuariosMapExterno,
}: ProcessoDetailsTabsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [usuariosMapLocal, setUsuariosMapLocal] = useState<Map<number, UsuarioInfo>>(new Map());
  const [tiposMap, setTiposMap] = useState<Map<number, TipoExpedienteInfo>>(new Map());

  // Usa mapa externo se fornecido, senão o local
  const usuariosMap = usuariosMapExterno && usuariosMapExterno.size > 0 ? usuariosMapExterno : usuariosMapLocal;

  useEffect(() => {
    let cancelled = false;
    const temUsuariosExternos = usuariosMapExterno && usuariosMapExterno.size > 0;

    async function fetchData() {
      setIsLoading(true);
      try {
        const promises: [
          ReturnType<typeof actionObterDetalhesComplementaresProcesso>,
          ReturnType<typeof actionListarUsuarios> | Promise<null>,
          ReturnType<typeof actionListarTiposExpedientes>,
        ] = [
          actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso),
          temUsuariosExternos ? Promise.resolve(null) : actionListarUsuarios({ ativo: true, limite: 200 }),
          actionListarTiposExpedientes({ limite: 200 }),
        ];

        const [result, usuariosResult, tiposResult] = await Promise.all(promises);
        if (cancelled) return;

        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }

        if (!temUsuariosExternos && usuariosResult && 'success' in usuariosResult && usuariosResult.success && usuariosResult.data?.usuarios) {
          const usuarios = usuariosResult.data.usuarios as Array<{
            id: number;
            nomeExibicao?: string;
            nome_exibicao?: string;
            nome?: string;
            avatarUrl?: string | null;
          }>;
          setUsuariosMapLocal(
            new Map(
              usuarios.map((usuario) => [
                usuario.id,
                {
                  id: usuario.id,
                  nomeExibicao:
                    usuario.nomeExibicao || usuario.nome_exibicao || usuario.nome || `Usuário ${usuario.id}`,
                  avatarUrl: usuario.avatarUrl ?? null,
                },
              ])
            )
          );
        }

        if (tiposResult.success && tiposResult.data?.data) {
          const tipos = tiposResult.data.data as Array<{ id: number; tipoExpediente?: string }>;
          setTiposMap(
            new Map(
              tipos.map((tipo) => [
                tipo.id,
                { id: tipo.id, tipoExpediente: tipo.tipoExpediente || `Tipo ${tipo.id}` },
              ])
            )
          );
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes complementares:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [processoId, numeroProcesso, usuariosMapExterno]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;
  const total = totalAudiencias + totalExpedientes + totalPericias;

  if (!isLoading && total === 0) {
    return null;
  }

  const loadingContent = (
    <div className="rounded-xl border bg-background/70 p-3 space-y-3">
      {[...Array(4)].map((_, index) => (
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
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/70 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <FileText className="h-3.5 w-3.5" />
            Expedientes {isLoading ? '...' : totalExpedientes}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Audiências {isLoading ? '...' : totalAudiencias}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <Microscope className="h-3.5 w-3.5" />
            Perícias {isLoading ? '...' : totalPericias}
          </span>
        </div>

        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setIsExpanded((current) => !current)}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? 'Recolher' : 'Expandir'}
        </Button>
      </div>

      <CollapsibleContent>
        <Tabs defaultValue="expedientes">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="expedientes" className="gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Expedientes
            {!isLoading && totalExpedientes > 0 && (
              <SemanticBadge category="status" value={totalExpedientes} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalExpedientes}
              </SemanticBadge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audiencias" className="gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            Audiências
            {!isLoading && totalAudiencias > 0 && (
              <SemanticBadge category="status" value={totalAudiencias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalAudiencias}
              </SemanticBadge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pericias" className="gap-1.5 text-sm">
            <Microscope className="h-3.5 w-3.5" />
            Perícias
            {!isLoading && totalPericias > 0 && (
              <SemanticBadge category="status" value={totalPericias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalPericias}
              </SemanticBadge>
            )}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          loadingContent
        ) : (
          <>
            <TabsContent value="expedientes" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <ExpedientesTable expedientes={expedientes} usuariosMap={usuariosMap} tiposMap={tiposMap} />
              </div>
            </TabsContent>
            <TabsContent value="audiencias" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <AudienciasTable audiencias={audiencias} />
              </div>
            </TabsContent>
            <TabsContent value="pericias" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <PericiasTable pericias={pericias} />
              </div>
            </TabsContent>
          </>
        )}
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}
