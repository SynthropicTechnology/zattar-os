'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CTPS_OPTIONS } from '../domain';
import type { RespostasVinculo, CtpsAssinada } from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloVinculoProps {
  data: RespostasVinculo;
  onChange: (data: RespostasVinculo) => void;
}

export function ModuloVinculo({ data, onChange }: ModuloVinculoProps) {
  const mostrarSubordinacao =
    data.ctps_assinada === 'nao_informal' || data.ctps_assinada === 'obrigado_mei';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">A Máscara do Vínculo</h3>
        <p className="text-sm text-muted-foreground">
          Investigar a formalização da relação de trabalho
        </p>
      </div>

      {/* A.1.1: Registro em CTPS */}
      <div className="space-y-2">
        <Label htmlFor="ctps">A carteira de trabalho (CTPS) foi assinada desde o primeiro dia de trabalho?</Label>
        <Select
          value={data.ctps_assinada ?? ''}
          onValueChange={(v) => onChange({ ...data, ctps_assinada: v as CtpsAssinada })}
        >
          <SelectTrigger id="ctps">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {CTPS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campo condicional: Subordinação */}
      {mostrarSubordinacao && (
        <div className="space-y-2">
          <Label htmlFor="subordinacao">
            Como era o controle de quem mandava em você? Quem dava as ordens?
          </Label>
          <Textarea
            id="subordinacao"
            placeholder="Descreva como funcionava a subordinação, quem dava ordens, horários, etc."
            value={data.narrativa_subordinacao ?? ''}
            onChange={(e) => onChange({ ...data, narrativa_subordinacao: e.target.value })}
            rows={4}
          />
          <OperadorAlert tipo="info">
            Solicite prints de WhatsApp com ordens do chefe ou foto da página de contrato da CTPS como prova.
          </OperadorAlert>
        </div>
      )}
    </div>
  );
}
