'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Building2,
  Calendar as CalendarIcon,
  ClipboardList,
  Clock,
  FileCheck2,

  ListTodo
} from 'lucide-react';

import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,

  DetailSheetMetaGrid,
  DetailSheetMetaItem,

  DetailSheetFooter,
} from '@/components/shared/detail-sheet';

import { getSemanticBadgeVariant } from '@/lib/design-system';

import type { Pericia } from '../domain';
import { SITUACAO_PERICIA_LABELS, SituacaoPericiaCodigo } from '../domain';

interface PericiaDetalhesDialogProps {
  pericia: Pericia | null;
  pericias?: Pericia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
}

function formatarData(dataISO: string | null): string {
  if (!dataISO) return '-';
  try {
    return format(new Date(dataISO), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PericiaListItem({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  return (
    <div className="rounded-xl border border-border/30 bg-card p-4 shadow-sm mb-4">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
          <TabsTrigger value="detalhes" className="rounded-md">Detalhes</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-md">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4 mt-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold text-foreground truncate">
                {pericia.numeroProcesso}
              </div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                {pericia.trt} • {pericia.grau}
              </div>
            </div>
            <div className="flex shrink-0">
              <AppBadge variant={getSemanticBadgeVariant('pericia_situacao', pericia.situacaoCodigo)}>
                {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
              </AppBadge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">Prazo Entrega</div>
              <div className="font-medium text-foreground/90">{formatarData(pericia.prazoEntrega)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">Laudo Juntado</div>
              <div className="font-medium text-foreground/90">{pericia.laudoJuntado ? 'Sim' : 'Não'}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">Especialidade</div>
              <div className="font-medium text-foreground/90">
                {pericia.especialidade?.descricao || '-'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">Perito</div>
              <div className="font-medium text-foreground/90">{pericia.perito?.nome || '-'}</div>
            </div>
          </div>

          {pericia.observacoes && (
            <div className="rounded-md bg-muted/30 border border-border/20 p-3 text-sm">
              <div className="font-semibold text-foreground/70 mb-1 text-[11px] uppercase tracking-wider">Observações</div>
              <div className="whitespace-pre-wrap text-foreground/80 text-xs leading-relaxed">{pericia.observacoes}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-[250px]" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PericiaSingleDetails({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  const responsavelNome = pericia.responsavel?.nomeExibicao || 'Sem responsável';
  const responsavelAvatar = (pericia.responsavel as { avatarUrl?: string })?.avatarUrl;

  return (
    <div className="space-y-6 pb-6">
      <DetailSheetMetaGrid className="rounded-xl border border-border/30 bg-muted/30 p-4">
        <DetailSheetMetaItem label="Prazo">
          <CalendarIcon className="size-3.5 text-muted-foreground/50" />
          <span className="tabular-nums font-medium text-foreground/90">
            {formatarData(pericia.prazoEntrega)}
          </span>
        </DetailSheetMetaItem>
        <DetailSheetMetaItem label="Laudo Juntado">
          <FileCheck2 className="size-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground/90">
            {pericia.laudoJuntado ? 'Sim' : 'Não'}
          </span>
        </DetailSheetMetaItem>
        <DetailSheetMetaItem label="Responsável">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar size="xs">
              <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
              <AvatarFallback className="text-[9px]">
                {getInitials(responsavelNome)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium text-foreground/90">{responsavelNome}</span>
          </div>
        </DetailSheetMetaItem>
      </DetailSheetMetaGrid>

      <DetailSheetSection icon={<ClipboardList className="size-3.5 text-muted-foreground/50" />} title="Dados da Perícia">
        <DetailSheetInfoRow label="Especialidade">
          {pericia.especialidade?.descricao || '-'}
        </DetailSheetInfoRow>
        <DetailSheetInfoRow label="Perito">
          {pericia.perito?.nome || '-'}
        </DetailSheetInfoRow>
      </DetailSheetSection>

      <DetailSheetSection icon={<Building2 className="size-3.5 text-muted-foreground/50" />} title="Processo">
        <div className="space-y-0.5">
          <span className="block font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
            {pericia.numeroProcesso}
          </span>
          <span className="block text-[11px] text-muted-foreground/60 mt-1">
            {pericia.trt} • {pericia.grau}
          </span>
        </div>
      </DetailSheetSection>

      {pericia.observacoes && (
        <DetailSheetSection icon={<ListTodo className="size-3.5 text-muted-foreground/50" />} title="Observações">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {pericia.observacoes}
          </p>
        </DetailSheetSection>
      )}

      <DetailSheetSection icon={<Clock className="size-3.5 text-muted-foreground/50" />} title="Histórico de Modificações">
        <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-[250px]" />
      </DetailSheetSection>
    </div>
  );
}

export function PericiaDetalhesDialog({
  pericia,
  pericias,
  open,
  onOpenChange,
  titulo,
}: PericiaDetalhesDialogProps) {
  const exibirLista = (pericias?.length ?? 0) > 0;
  const periciaUnica = !exibirLista ? pericia : null;

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      <DetailSheetHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="size-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DetailSheetTitle badge={periciaUnica ? (
              <AppBadge variant={getSemanticBadgeVariant('pericia_situacao', periciaUnica.situacaoCodigo)}>
                {SITUACAO_PERICIA_LABELS[periciaUnica.situacaoCodigo]}
              </AppBadge>
            ) : null}>
              {titulo || (exibirLista ? 'Perícias do Dia' : 'Detalhes da Perícia')}
            </DetailSheetTitle>
            {periciaUnica?.dataCriacao && (
              <DetailSheetDescription>
                Criada em {formatarData(periciaUnica.dataCriacao)}
              </DetailSheetDescription>
            )}
            {exibirLista && (
              <DetailSheetDescription>
                {pericias!.length} perícia{pericias!.length !== 1 ? 's' : ''} nesta data
              </DetailSheetDescription>
            )}
          </div>
        </div>
      </DetailSheetHeader>

      <DetailSheetContent className="pb-0">
        <div className="px-1 pt-4">
          {exibirLista ? (
            <div className="space-y-1">
              {pericias!.map((p) => (
                <PericiaListItem key={p.id} pericia={p} />
              ))}
            </div>
          ) : periciaUnica ? (
            <PericiaSingleDetails pericia={periciaUnica} />
          ) : null}
        </div>
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
