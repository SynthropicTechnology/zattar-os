'use client';

/**
 * PericiaCriarDialog - Dialog para criação manual de perícias
 */

import * as React from 'react';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toDateString } from '@/lib/date-utils';
import {
  CodigoTribunal,
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';
import type { UsuarioOption, EspecialidadePericiaOption, PeritoOption } from '../types';
import { actionCriarPericia } from '../actions/pericias-actions';

interface PericiaCriarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  onSuccess?: () => void;
}

export function PericiaCriarDialog({
  open,
  onOpenChange,
  especialidades,
  peritos,
  onSuccess,
}: PericiaCriarDialogProps) {
  const [numeroProcesso, setNumeroProcesso] = React.useState('');
  const [trt, setTrt] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [prazoEntrega, setPrazoEntrega] = React.useState<Date | null>(null);
  const [situacaoCodigo, setSituacaoCodigo] = React.useState<string>(SituacaoPericiaCodigo.AGUARDANDO_LAUDO);
  const [especialidadeId, setEspecialidadeId] = React.useState('');
  const [peritoId, setPeritoId] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setNumeroProcesso('');
    setTrt('');
    setGrau('');
    setPrazoEntrega(null);
    setSituacaoCodigo(SituacaoPericiaCodigo.AGUARDANDO_LAUDO);
    setEspecialidadeId('');
    setPeritoId('');
    setObservacoes('');
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('numeroProcesso', numeroProcesso);
      fd.append('trt', trt);
      fd.append('grau', grau);
      if (prazoEntrega) {
        fd.append('prazoEntrega', toDateString(prazoEntrega));
      }
      fd.append('situacaoCodigo', situacaoCodigo);
      if (especialidadeId && especialidadeId !== '_none') {
        fd.append('especialidadeId', especialidadeId);
      }
      if (peritoId && peritoId !== '_none') {
        fd.append('peritoId', peritoId);
      }
      if (observacoes) {
        fd.append('observacoes', observacoes);
      }

      const result = await actionCriarPericia(fd);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar perícia.');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = numeroProcesso.length >= 20 && trt && grau;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Nova Perícia"
      maxWidth="lg"
      footer={
        <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
          {isSaving ? 'Criando...' : 'Criar Perícia'}
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Número do Processo */}
        <div className="md:col-span-2 grid gap-2">
          <label className="text-sm font-medium">
            Número do Processo <span className="text-destructive">*</span>
          </label>
          <Input
            value={numeroProcesso}
            onChange={(e) => setNumeroProcesso(e.target.value)}
            placeholder="0000000-00.0000.0.00.0000"
            className="bg-card"
            disabled={isSaving}
          />
          {numeroProcesso && numeroProcesso.length < 20 && (
            <span className="text-xs text-muted-foreground">
              Mínimo 20 caracteres ({numeroProcesso.length}/20)
            </span>
          )}
        </div>

        {/* TRT */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            TRT <span className="text-destructive">*</span>
          </label>
          <Select value={trt || '_none'} onValueChange={(v) => setTrt(v === '_none' ? '' : v)}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione o TRT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Selecione...</SelectItem>
              {CodigoTribunal.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grau */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Grau <span className="text-destructive">*</span>
          </label>
          <Select value={grau || '_none'} onValueChange={(v) => setGrau(v === '_none' ? '' : v)}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione o grau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Selecione...</SelectItem>
              {Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prazo de Entrega */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Prazo de Entrega</label>
          <DatePicker
            value={prazoEntrega}
            onChange={setPrazoEntrega}
            placeholder="Selecionar data"
          />
        </div>

        {/* Situação */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Situação</label>
          <Select value={situacaoCodigo} onValueChange={setSituacaoCodigo}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione a situação" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SituacaoPericiaCodigo).map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {SITUACAO_PERICIA_LABELS[codigo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Especialidade */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Especialidade</label>
          <Select
            value={especialidadeId || '_none'}
            onValueChange={(v) => setEspecialidadeId(v === '_none' ? '' : v)}
          >
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione a especialidade" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="_none">Nenhuma</SelectItem>
              {especialidades.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Perito */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Perito</label>
          <Select
            value={peritoId || '_none'}
            onValueChange={(v) => setPeritoId(v === '_none' ? '' : v)}
          >
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione o perito" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="_none">Nenhum</SelectItem>
              {peritos.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observações */}
        <div className="md:col-span-2 grid gap-2">
          <label className="text-sm font-medium">Observações</label>
          <Textarea
            value={observacoes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
            placeholder="Adicione observações sobre a perícia..."
            className="min-h-25 resize-none"
            disabled={isSaving}
          />
        </div>

        {error && <div className="md:col-span-2 text-sm text-destructive">{error}</div>}
      </div>
    </DialogFormShell>
  );
}
