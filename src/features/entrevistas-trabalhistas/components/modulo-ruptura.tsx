'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MOTIVO_RUPTURA_OPTIONS, VERBAS_RECEBIDAS_OPTIONS } from '../domain';
import type { RespostasRuptura, MotivoRuptura, VerbaRecebida } from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloRupturaProps {
  data: RespostasRuptura;
  onChange: (data: RespostasRuptura) => void;
}

export function ModuloRuptura({ data, onChange }: ModuloRupturaProps) {
  const verbas = data.verbas_recebidas ?? [];

  const toggleVerba = (value: VerbaRecebida, checked: boolean) => {
    const updated = checked
      ? [...verbas, value]
      : verbas.filter((v) => v !== value);
    onChange({ ...data, verbas_recebidas: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">A Ruptura e o Acerto de Contas</h3>
        <p className="text-sm text-muted-foreground">
          Como o trabalho terminou e se as verbas foram pagas
        </p>
      </div>

      {/* A.4.1: Motivo do término */}
      <div className="space-y-2">
        <Label htmlFor="motivo">Como o trabalho terminou?</Label>
        <Select
          value={data.motivo ?? ''}
          onValueChange={(v) => onChange({ ...data, motivo: v as MotivoRuptura })}
        >
          <SelectTrigger id="motivo">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {MOTIVO_RUPTURA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* A.4.2: Verbas rescisórias */}
      <div className="space-y-3">
        <Label>Recebeu o acerto rescisório e guias do FGTS e Seguro-Desemprego?</Label>
        <div className="space-y-2">
          {VERBAS_RECEBIDAS_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`verba-${opt.value}`}
                checked={verbas.includes(opt.value)}
                onCheckedChange={(checked) => toggleVerba(opt.value, checked === true)}
              />
              <Label htmlFor={`verba-${opt.value}`} className="cursor-pointer text-sm font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <OperadorAlert tipo="info">
        Solicite o Termo de Rescisão (TRCT) e o extrato do FGTS como anexos.
      </OperadorAlert>
    </div>
  );
}
