'use client';

// Componente de diálogo para baixar expediente

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import { actionBaixarExpediente, type ActionResult } from '../actions';
import { Expediente, ResultadoDecisao, RESULTADO_DECISAO_LABELS } from '../domain';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes/hooks/use-tipos-expedientes';

interface ExpedientesBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBaixarDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesBaixarDialogProps) {
  const [modo, setModo] = React.useState<'protocolo' | 'justificativa'>('protocolo');
  const [formState, formAction, isPending] = useActionState(
    actionBaixarExpediente,
    initialState
  );

  const { tiposExpedientes } = useTiposExpedientes({ limite: 1000 }); // Busca os tipos (idealmente já cacheados)

  const currentTipo = React.useMemo(() => {
    return tiposExpedientes.find(t => t.id === expediente?.tipoExpedienteId);
  }, [tiposExpedientes, expediente?.tipoExpedienteId]);

  const requiresDecisao = React.useMemo(() => {
    if (!currentTipo?.tipoExpediente) return false;
    const isTarget = ['recurso ordinário', 'recurso de revista', 'agravo de instrumento em recurso de revista'].includes(
      currentTipo.tipoExpediente.toLowerCase().trim()
    );
    return isTarget;
  }, [currentTipo]);

  React.useEffect(() => {
    if (!open) {
      setModo('protocolo');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  if (!expediente) {
    return null;
  }

  // Determine if there's a general error message or a specific field error
  const generalError = !formState.success ? (formState.error || formState.message) : null;
  const protocoloIdError = !formState.success ? formState.errors?.protocoloId?.[0] : undefined;
  const justificativaBaixaError = !formState.success ? formState.errors?.justificativaBaixa?.[0] : undefined;
  const resultadoDecisaoError = !formState.success ? formState.errors?.resultadoDecisao?.[0] : undefined;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="baixar-expediente-form"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Baixar Expediente
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Baixar Expediente"
      maxWidth="lg"
      footer={footerButtons}
    >
      <form id="baixar-expediente-form" action={formAction} className="space-y-6">
        {/* Hidden input para o ID do expediente */}
        <input type="hidden" name="expedienteId" value={expediente.id} />

        {/* Informações do expediente */}
        <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
          <div className="text-sm font-medium">Expediente</div>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Processo:</span> {expediente.numeroProcesso}
            </div>
            <div>
              <span className="font-medium">Parte Autora:</span> {expediente.nomeParteAutora}
            </div>
            <div>
              <span className="font-medium">Parte Ré:</span> {expediente.nomeParteRe}
            </div>
          </div>
        </div>

        {/* Modo de baixa */}
        <div className="space-y-2">
          <Label>Forma de Baixa</Label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="modo"
                value="protocolo"
                checked={modo === 'protocolo'}
                onChange={(e) => setModo(e.target.value as 'protocolo')}
                className="h-4 w-4"
              />
              <span className="text-sm">Com Protocolo</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="modo"
                value="justificativa"
                checked={modo === 'justificativa'}
                onChange={(e) => setModo(e.target.value as 'justificativa')}
                className="h-4 w-4"
              />
              <span className="text-sm">Sem Protocolo</span>
            </label>
          </div>
        </div>

        {/* Campo de protocolo */}
        {modo === 'protocolo' && (
          <div className="space-y-2">
            <Label htmlFor="protocoloId">ID do Protocolo *</Label>
            <Input
              id="protocoloId"
              name="protocoloId"
              type="text"
              placeholder="Ex: ABC12345"
              disabled={isPending}
              required={modo === 'protocolo'}
            />
            {protocoloIdError && (
              <p className="text-sm font-medium text-destructive">{protocoloIdError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Informe o ID do protocolo da peça protocolada em resposta ao expediente (pode conter números e letras).
            </p>
          </div>
        )}

        {/* Campo de justificativa */}
        {modo === 'justificativa' && (
          <div className="space-y-2">
            <Label htmlFor="justificativaBaixa">Justificativa da Baixa *</Label>
            <textarea
              id="justificativaBaixa"
              name="justificativaBaixa"
              placeholder="Ex: Expediente resolvido extrajudicialmente..."
              disabled={isPending}
              rows={4}
              required={modo === 'justificativa'}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {justificativaBaixaError && (
              <p className="text-sm font-medium text-destructive">{justificativaBaixaError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Informe o motivo pelo qual o expediente está sendo baixado sem protocolo de peça.
            </p>
          </div>
        )}

        {/* Informações da Decisão */}
        {requiresDecisao && (
          <div className="space-y-3 pt-2">
            <Label>Resultado da Decisão *</Label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.FAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{RESULTADO_DECISAO_LABELS[ResultadoDecisao.FAVORAVEL]}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.PARCIALMENTE_FAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{RESULTADO_DECISAO_LABELS[ResultadoDecisao.PARCIALMENTE_FAVORAVEL]}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.DESFAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{RESULTADO_DECISAO_LABELS[ResultadoDecisao.DESFAVORAVEL]}</span>
              </label>
            </div>
            {resultadoDecisaoError && (
              <p className="text-sm font-medium text-destructive">{resultadoDecisaoError}</p>
            )}
          </div>
        )}

        {/* Mensagem de erro */}
        {generalError && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {generalError}
          </div>
        )}
      </form>
    </DialogFormShell>
  );
}
