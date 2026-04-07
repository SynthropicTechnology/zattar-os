'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Typography } from '@/components/ui/typography';

import type { TipoCaptura } from '@/app/(authenticated)/captura';
import { CapturaFormBase, TipoCapturaSelect, validarCamposCaptura } from '@/app/(authenticated)/captura';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AgendamentoDialog({ open, onOpenChange, onSuccess }: Props) {
  const [tipoCaptura, setTipoCaptura] = React.useState<TipoCaptura>('acervo_geral');
  const [advogadoId, setAdvogadoId] = React.useState<number | null>(null);
  const [credencialIds, setCredencialIds] = React.useState<number[]>([]);
  const [periodicidade, setPeriodicidade] = React.useState<'diario' | 'a_cada_N_dias'>('diario');
  const [diasIntervalo, setDiasIntervalo] = React.useState('');
  const [horario, setHorario] = React.useState('07:00');
  const [ativo, setAtivo] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    // Reset simples ao abrir para evitar “estado fantasma” entre usos do dialog.
    setTipoCaptura('acervo_geral');
    setAdvogadoId(null);
    setCredencialIds([]);
    setPeriodicidade('diario');
    setDiasIntervalo('');
    setHorario('07:00');
    setAtivo(true);
    setIsSaving(false);
  }, [open]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (!validarCamposCaptura(advogadoId, credencialIds)) {
        throw new Error('Selecione um advogado e ao menos uma credencial');
      }

      const payload: Record<string, unknown> = {
        tipo_captura: tipoCaptura,
        advogado_id: advogadoId,
        credencial_ids: credencialIds,
        periodicidade,
        horario,
        ativo,
      };

      if (periodicidade === 'a_cada_N_dias') {
        const dias = Number(diasIntervalo);
        if (!dias || dias <= 0) throw new Error('dias_intervalo obrigatório quando periodicidade = a_cada_N_dias');
        payload.dias_intervalo = dias;
      }

      const res = await fetch('/api/captura/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string')
          ? (json as { error: string }).error
          : 'Erro ao criar agendamento';
        throw new Error(msg);
      }

      toast.success('Agendamento criado');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={<Typography.H3 as="span">Novo agendamento</Typography.H3>}
      maxWidth="2xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de captura</Label>
            <TipoCapturaSelect
              value={tipoCaptura}
              onValueChange={setTipoCaptura}
              apenasAgendaveis
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Periodicidade</Label>
            <Select value={periodicidade} onValueChange={(v) => setPeriodicidade(v as 'diario' | 'a_cada_N_dias')}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="a_cada_N_dias">A cada N dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Horário (HH:mm)</Label>
            <Input
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="07:00"
              className="bg-background"
            />
          </div>

          {periodicidade === 'a_cada_N_dias' && (
            <div className="space-y-2 md:col-span-2">
              <Label>Dias de intervalo</Label>
              <Input
                value={diasIntervalo}
                onChange={(e) => setDiasIntervalo(e.target.value)}
                inputMode="numeric"
                className="bg-background"
              />
            </div>
          )}
        </div>

        <CapturaFormBase
          advogadoId={advogadoId}
          credenciaisSelecionadas={credencialIds}
          onAdvogadoChange={setAdvogadoId}
          onCredenciaisChange={setCredencialIds}
        />

        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
          <div className="space-y-1">
            <Typography.Small className="font-semibold">Ativo</Typography.Small>
            <Typography.Muted className="text-xs">
              Agendamentos inativos não executam automaticamente.
            </Typography.Muted>
          </div>
          <Switch checked={ativo} onCheckedChange={setAtivo} />
        </div>
      </div>
    </DialogFormShell>
  );
}


