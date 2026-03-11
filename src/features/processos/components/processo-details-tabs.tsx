'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  FileText,
  Microscope,
  Loader2,
  ExternalLink,
  Video,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionObterDetalhesComplementaresProcesso } from '../actions';
import type { Audiencia } from '@/features/audiencias/domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
} from '@/features/audiencias/domain';
import type { Expediente } from '@/features/expedientes/domain';
import { ORIGEM_EXPEDIENTE_LABELS, type OrigemExpediente } from '@/features/expedientes/domain';
import type { Pericia } from '@/features/pericias/domain';
import { SITUACAO_PERICIA_LABELS, type SituacaoPericiaCodigo } from '@/features/pericias/domain';

interface ProcessoDetailsTabsProps {
  processoId: number;
  numeroProcesso: string;
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

// ─── Status Badges ──────────────────────────────────────────────────────────

function StatusAudienciaBadge({ status }: { status: StatusAudiencia }) {
  const label = STATUS_AUDIENCIA_LABELS[status] || status;

  const variant =
    status === StatusAudiencia.Marcada
      ? 'info' as const
      : status === StatusAudiencia.Finalizada
        ? 'success' as const
        : 'neutral' as const;

  return (
    <Badge variant={variant} tone="soft" className="text-xs">
      {label}
    </Badge>
  );
}

function PrazoBadge({ data, baixadoEm }: { data: string | null | undefined; baixadoEm: string | null | undefined }) {
  if (!data) return <span className="text-muted-foreground text-xs">Sem prazo</span>;

  const vencido = isPast(new Date(data));
  const respondido = !!baixadoEm;

  if (respondido) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs whitespace-nowrap">{formatarData(data)}</span>
        <Badge variant="success" tone="soft" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-0.5" />
          Respondido
        </Badge>
      </div>
    );
  }

  if (vencido) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs whitespace-nowrap text-destructive font-medium">{formatarData(data)}</span>
        <Badge variant="destructive" tone="soft" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          Vencido
        </Badge>
      </div>
    );
  }

  const relativa = formatarDataRelativa(data);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs whitespace-nowrap">{formatarData(data)}</span>
      <Badge variant="warning" tone="soft" className="text-xs">
        <Clock className="h-3 w-3 mr-0.5" />
        {relativa || 'No prazo'}
      </Badge>
    </div>
  );
}

function SituacaoPericiaBadge({ codigo }: { codigo: SituacaoPericiaCodigo }) {
  const label = SITUACAO_PERICIA_LABELS[codigo] || codigo;
  return <Badge variant="outline" className="text-xs">{label}</Badge>;
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Data</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Tipo</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Sala</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Status</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Modalidade</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((aud) => (
            <tr key={aud.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4 whitespace-nowrap text-xs">
                {formatarDataHora(aud.dataInicio)}
              </td>
              <td className="py-2.5 pr-4 text-xs">
                {aud.tipoDescricao || '--'}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-xs">
                {aud.salaAudienciaNome || '--'}
              </td>
              <td className="py-2.5 pr-4">
                <StatusAudienciaBadge status={aud.status} />
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1.5">
                  {aud.modalidade && (
                    <span className="text-xs text-muted-foreground">
                      {MODALIDADE_AUDIENCIA_LABELS[aud.modalidade]}
                    </span>
                  )}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpedientesTable({ expedientes }: { expedientes: Expediente[] }) {
  const sorted = useMemo(
    () =>
      [...expedientes].sort((a, b) => {
        const dateA = a.dataCriacaoExpediente ? new Date(a.dataCriacaoExpediente).getTime() : 0;
        const dateB = b.dataCriacaoExpediente ? new Date(b.dataCriacaoExpediente).getTime() : 0;
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
        const origemLabel = ORIGEM_EXPEDIENTE_LABELS[exp.origem as OrigemExpediente] || exp.origem?.replace('_', ' ') || '--';
        const vencido = exp.dataPrazoLegalParte && !exp.baixadoEm && exp.prazoVencido;

        return (
          <div
            key={exp.id}
            className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 ${vencido ? 'border-destructive/30 bg-destructive/5' : ''}`}
          >
            {/* Linha 1: Origem + Data + Prazo */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" tone="soft" className="text-xs">
                {origemLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Criado em {formatarData(exp.dataCriacaoExpediente)}
              </span>
              {exp.dataCienciaParte && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    Ciência em {formatarData(exp.dataCienciaParte)}
                  </span>
                </>
              )}
              <div className="ml-auto">
                <PrazoBadge data={exp.dataPrazoLegalParte} baixadoEm={exp.baixadoEm} />
              </div>
            </div>

            {/* Linha 2: Descrição da intimação / arquivos */}
            {exp.descricaoArquivos && (
              <p className="mt-1.5 text-sm text-foreground leading-relaxed">
                <FileDown className="inline h-3.5 w-3.5 mr-1 text-muted-foreground align-text-bottom" />
                {exp.descricaoArquivos}
              </p>
            )}

            {/* Linha 3: Metadados adicionais */}
            <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              {exp.siglaOrgaoJulgador && (
                <span>{exp.siglaOrgaoJulgador}</span>
              )}
              {exp.observacoes && (
                <span className="italic">
                  {exp.observacoes.length > 80 ? `${exp.observacoes.slice(0, 80)}...` : exp.observacoes}
                </span>
              )}
              {exp.baixadoEm && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Baixado em {formatarData(exp.baixadoEm)}
                  {exp.protocoloId && ` · Protocolo: ${exp.protocoloId}`}
                </span>
              )}
              {exp.arquivoNome && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {exp.arquivoNome}
                </span>
              )}
            </div>
          </div>
        );
      })}
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Situação</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Especialidade</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Perito</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Prazo Entrega</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Laudo</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((per) => (
            <tr key={per.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4">
                <SituacaoPericiaBadge codigo={per.situacaoCodigo} />
              </td>
              <td className="py-2.5 pr-4 text-xs">
                {per.especialidade?.descricao || '--'}
              </td>
              <td className="py-2.5 pr-4 text-xs">
                {per.perito?.nome || '--'}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-xs">
                {formatarData(per.prazoEntrega)}
              </td>
              <td className="py-2.5">
                {per.laudoJuntado ? (
                  <Badge variant="success" tone="soft" className="text-xs">
                    Juntado
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">Pendente</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProcessoDetailsTabs({
  processoId,
  numeroProcesso,
}: ProcessoDetailsTabsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso);
        if (cancelled) return;
        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes complementares:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;
  const total = totalAudiencias + totalExpedientes + totalPericias;

  if (!isLoading && total === 0) {
    return null;
  }

  return (
    <div className="border-t pt-3">
      <Tabs defaultValue="expedientes">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="expedientes" className="gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Expedientes
            {!isLoading && totalExpedientes > 0 && (
              <Badge variant="secondary" tone="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalExpedientes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audiencias" className="gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            Audiências
            {!isLoading && totalAudiencias > 0 && (
              <Badge variant="secondary" tone="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalAudiencias}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pericias" className="gap-1.5 text-sm">
            <Microscope className="h-3.5 w-3.5" />
            Perícias
            {!isLoading && totalPericias > 0 && (
              <Badge variant="secondary" tone="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalPericias}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <TabsContent value="expedientes" className="pt-3 mt-0">
              <ExpedientesTable expedientes={expedientes} />
            </TabsContent>
            <TabsContent value="audiencias" className="pt-3 mt-0">
              <AudienciasTable audiencias={audiencias} />
            </TabsContent>
            <TabsContent value="pericias" className="pt-3 mt-0">
              <PericiasTable pericias={pericias} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
