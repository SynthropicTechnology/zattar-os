'use client';

import * as React from 'react';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Expediente } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { format } from 'date-fns';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';

interface ExpedienteDetalhesDialogProps {
  expediente: Expediente | null;
  expedientes?: Expediente[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  onSuccess?: () => void;
}

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    return format(new Date(dataISO), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const getStatusTexto = (baixadoEm: string | null): string => {
  return baixadoEm ? 'Baixado' : 'Pendente';
};

interface PrazoEditorProps {
  exp: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}

const PrazoEditor: React.FC<PrazoEditorProps> = ({ exp, onUpdated, onSuccess }) => {
  const [openEdit, setOpenEdit] = React.useState(false);
  const [dt, setDt] = React.useState<Date | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  const salvar = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (dt) {
        formData.append('dataPrazoLegalParte', dt.toISOString());
      }

      const result = await actionAtualizarExpediente(exp.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar prazo');
      }

      const iso = dt ? dt.toISOString() : null;
      const agora = new Date();
      const fim = iso ? new Date(iso) : null;
      const prazoVencido = !exp.baixadoEm && fim ? fim.getTime() < agora.getTime() : false;

      const atualizado = {
        ...exp,
        dataPrazoLegalParte: iso,
        prazoVencido
      } as Expediente;

      onUpdated(atualizado);
      if (onSuccess) onSuccess();
      setOpenEdit(false);
      setDt(undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (exp.baixadoEm) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {!openEdit && (
        <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>
          {exp.dataPrazoLegalParte ? 'Alterar Prazo' : 'Definir Prazo'}
        </Button>
      )}

      {openEdit && (
        <div className="flex items-center gap-2">
          <FormDatePicker
            value={dt ? dt.toISOString() : undefined}
            onChange={(val) => setDt(val ? new Date(val) : undefined)}
            className="w-35"
          />
          <Button size="sm" onClick={salvar} disabled={saving || !dt}>{saving ? '...' : 'OK'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenEdit(false)} disabled={saving}>X</Button>
        </div>
      )}
    </div>
  );
};

function ExpedienteListItem({
  exp,
  onUpdated,
  onSuccess
}: {
  exp: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('expedientes', exp.id);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-3 mt-0">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg flex items-center gap-2">
              {exp.classeJudicial && <span className="text-muted-foreground text-sm uppercase">{exp.classeJudicial}</span>}
              {exp.numeroProcesso}
            </div>
            <div className="flex gap-2">
              <SemanticBadge category="expediente_status" value={getStatusTexto(exp.baixadoEm)}>
                {getStatusTexto(exp.baixadoEm)}
              </SemanticBadge>
              <AppBadge variant={exp.prazoVencido ? 'destructive' : 'outline'}>
                {exp.prazoVencido ? 'Vencido' : 'No Prazo'}
              </AppBadge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Data de Ciência</div>
              <div className="font-medium">{formatarData(exp.dataCienciaParte)}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Prazo Legal</div>
              <div className="font-medium">{formatarData(exp.dataPrazoLegalParte)}</div>
            </div>

            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Órgão Julgador</div>
              <div>{exp.descricaoOrgaoJulgador || '-'}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Parte Autora</div>
              <div className="truncate" title={exp.nomeParteAutora || ''}>{exp.nomeParteAutora || '-'}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Parte Ré</div>
              <div className="truncate" title={exp.nomeParteRe || ''}>{exp.nomeParteRe || '-'}</div>
            </div>
          </div>
          <PrazoEditor
            exp={exp}
            onUpdated={onUpdated}
            onSuccess={onSuccess}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-75" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExpedienteSingleDetails({
  expediente,
  onUpdated,
  onSuccess
}: {
  expediente: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('expedientes', expediente.id);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Status</div>
              <div className="flex gap-2">
                <SemanticBadge category="expediente_status" value={getStatusTexto(expediente.baixadoEm)}>
                  {getStatusTexto(expediente.baixadoEm)}
                </SemanticBadge>
                <AppBadge variant={expediente.prazoVencido ? 'destructive' : 'outline'}>
                  {expediente.prazoVencido ? 'Vencido' : 'No Prazo'}
                </AppBadge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Número do Processo</div>
                <div className="font-medium text-lg">
                  {expediente.numeroProcesso}
                </div>
                {expediente.classeJudicial && <div className="text-sm text-muted-foreground">{expediente.classeJudicial}</div>}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Órgão Julgador</div>
                <div className="font-medium">{expediente.descricaoOrgaoJulgador || '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/10 p-3 rounded-md border">
                <div className="text-xs text-muted-foreground mb-1">Data de Ciência</div>
                <div className="font-medium">{formatarData(expediente.dataCienciaParte)}</div>
              </div>
              <div className="bg-muted/10 p-3 rounded-md border">
                <div className="text-xs text-muted-foreground mb-1">Prazo Legal</div>
                <div className="font-medium">{formatarData(expediente.dataPrazoLegalParte)}</div>
                <PrazoEditor
                  exp={expediente}
                  onUpdated={onUpdated}
                  onSuccess={onSuccess}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Parte Autora</div>
                <div className="font-medium">{expediente.nomeParteAutora || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Parte Ré</div>
                <div className="font-medium">{expediente.nomeParteRe || '-'}</div>
              </div>
            </div>

            {expediente.baixadoEm && (
              <div className="bg-success/5 p-3 rounded-md border border-success/15">
                <div className="text-sm text-success font-semibold mb-1">Baixado em</div>
                <div className="font-medium">{formatarData(expediente.baixadoEm)}</div>
                {expediente.justificativaBaixa && (
                  <div className="text-sm mt-1 text-muted-foreground">&ldquo;{expediente.justificativaBaixa}&rdquo;</div>
                )}
              </div>
            )}

            {expediente.observacoes && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="font-semibold mb-1">Observações</div>
                <div className="whitespace-pre-wrap">{expediente.observacoes}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-125" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ExpedienteDetalhesDialog({
  expediente,
  expedientes,
  open,
  onOpenChange,
  titulo,
  onSuccess
}: ExpedienteDetalhesDialogProps) {
  const [listaLocal, setListaLocal] = React.useState<Expediente[]>(expedientes || []);
  React.useEffect(() => { setListaLocal(expedientes || []); }, [expedientes]);

  const [expLocal, setExpLocal] = React.useState<Expediente | null>(expediente);
  React.useEffect(() => { setExpLocal(expediente || null); }, [expediente]);

  const exibirLista = listaLocal && listaLocal.length > 0;
  const expedienteUnico = !exibirLista && expLocal;

  const footerButton = (
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Fechar
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={titulo || (exibirLista ? 'Expedientes do Dia' : 'Detalhes do Expediente')}
      maxWidth="2xl"
      footer={footerButton}
    >
      <ScrollArea className="max-h-[60vh] pr-4">
        {exibirLista ? (
          <div className="space-y-4">
            {listaLocal.map((exp) => (
              <ExpedienteListItem
                key={exp.id}
                exp={exp}
                onUpdated={(u) => setListaLocal((prev) => prev.map((p) => (p.id === u.id ? u : p)))}
                onSuccess={onSuccess}
              />
            ))}
          </div>
        ) : expedienteUnico ? (
          <ExpedienteSingleDetails
            expediente={expedienteUnico}
            onUpdated={(u) => setExpLocal(u)}
            onSuccess={onSuccess}
          />
        ) : null}
      </ScrollArea>
    </DialogFormShell>
  );
}
