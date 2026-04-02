'use client';

import * as React from 'react';
import { format } from 'date-fns';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';

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
    return format(new Date(dataISO), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
}

function getSituacaoVariant(codigo: SituacaoPericiaCodigo) {
  const variantMap: Record<string, 'success' | 'info' | 'destructive' | 'warning' | 'secondary'> = {
    F: 'success',
    P: 'info',
    C: 'destructive',
    L: 'warning',
    S: 'warning',
    R: 'secondary',
  };
  return variantMap[codigo] || 'secondary';
}

function PericiaListItem({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-3 mt-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-base truncate">
                {pericia.numeroProcesso}
              </div>
              <div className="text-xs text-muted-foreground">
                {pericia.trt} • {pericia.grau}
              </div>
            </div>
            <AppBadge variant={getSituacaoVariant(pericia.situacaoCodigo)}>
              {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
            </AppBadge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Prazo Entrega</div>
              <div className="font-medium">{formatarData(pericia.prazoEntrega)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Laudo Juntado</div>
              <div className="font-medium">{pericia.laudoJuntado ? 'Sim' : 'Não'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Especialidade</div>
              <div className="font-medium">
                {pericia.especialidade?.descricao || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Perito</div>
              <div className="font-medium">{pericia.perito?.nome || '-'}</div>
            </div>
          </div>

          {pericia.observacoes && (
            <div className="bg-muted/30 border rounded-md p-3 text-sm">
              <div className="font-semibold mb-1">Observações</div>
              <div className="whitespace-pre-wrap">{pericia.observacoes}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-[300px]" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PericiaSingleDetails({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4 mt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AppBadge variant={getSituacaoVariant(pericia.situacaoCodigo)}>
                {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
              </AppBadge>
              {pericia.laudoJuntado && (
                <AppBadge variant="info">Laudo juntado</AppBadge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Processo</div>
              <div className="font-medium">{pericia.numeroProcesso}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">TRT / Grau</div>
              <div className="font-medium">
                {pericia.trt} • {pericia.grau}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Prazo Entrega</div>
              <div className="font-medium">
                {formatarData(pericia.prazoEntrega)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Data Criação</div>
              <div className="font-medium">
                {formatarData(pericia.dataCriacao)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Especialidade</div>
              <div className="font-medium">
                {pericia.especialidade?.descricao || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Perito</div>
              <div className="font-medium">{pericia.perito?.nome || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Responsável</div>
              <div className="font-medium">
                {pericia.responsavel?.nomeExibicao || 'Sem responsável'}
              </div>
            </div>
          </div>

          {pericia.observacoes && (
            <div className="bg-muted/30 border rounded-md p-3 text-sm">
              <div className="font-semibold mb-1">Observações</div>
              <div className="whitespace-pre-wrap">{pericia.observacoes}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-[500px]" />
        </TabsContent>
      </Tabs>
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

  const footerButton = (
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Fechar
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={titulo || (exibirLista ? 'Perícias do Dia' : 'Detalhes da Perícia')}
      maxWidth="2xl"
      footer={footerButton}
    >
      <ScrollArea className="max-h-[60vh] pr-4">
        {exibirLista ? (
          <div className="space-y-4">
            {pericias!.map((p) => (
              <PericiaListItem key={p.id} pericia={p} />
            ))}
          </div>
        ) : periciaUnica ? (
          <PericiaSingleDetails pericia={periciaUnica} />
        ) : null}
      </ScrollArea>
    </DialogFormShell>
  );
}
