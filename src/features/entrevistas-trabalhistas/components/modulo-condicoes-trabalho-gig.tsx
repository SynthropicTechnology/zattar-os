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
import {
  FAIXA_HORAS_DIA_OPTIONS,
  DIAS_SEMANA_OPTIONS,
} from '../domain';
import type {
  RespostasCondicoesTrabalhoGig,
  FaixaHorasDia,
  DiasSemana,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloCondicoesTrabalhoGigProps {
  data: RespostasCondicoesTrabalhoGig;
  onChange: (data: RespostasCondicoesTrabalhoGig) => void;
}

export function ModuloCondicoesTrabalhoGig({ data, onChange }: ModuloCondicoesTrabalhoGigProps) {
  const mostrarAssistencia = data.sofreu_acidente === true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Precarização do Trabalho</h3>
        <p className="text-sm text-muted-foreground">
          Condições reais de trabalho: jornada, segurança e dignidade do trabalhador de plataforma
        </p>
      </div>

      {/* B.3.1: Horas por dia */}
      <div className="space-y-2">
        <Label htmlFor="horas-dia">Quantas horas por dia trabalhava em média na plataforma?</Label>
        <Select
          value={data.horas_dia ?? ''}
          onValueChange={(v) => onChange({ ...data, horas_dia: v as FaixaHorasDia })}
        >
          <SelectTrigger id="horas-dia">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {FAIXA_HORAS_DIA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* B.3.2: Dias por semana */}
      <div className="space-y-2">
        <Label htmlFor="dias-semana">Quantos dias por semana?</Label>
        <Select
          value={data.dias_semana ?? ''}
          onValueChange={(v) => onChange({ ...data, dias_semana: v as DiasSemana })}
        >
          <SelectTrigger id="dias-semana">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {DIAS_SEMANA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(data.horas_dia === 'mais_12' || data.dias_semana === '7') && (
        <OperadorAlert tipo="aviso">
          Jornadas superiores a 8h diárias sem controle formal violam os arts. 7°, XIII e 58 da CLT. Trabalho 7 dias por semana viola o direito ao repouso semanal remunerado (art. 7°, XV, CF).
        </OperadorAlert>
      )}

      {/* B.3.3: Acesso a banheiro/descanso */}
      <div className="space-y-3">
        <Label>Tinha acesso a banheiro e local de descanso durante o trabalho?</Label>
        <SimNaoRadio
          id="acesso-banheiro"
          value={data.acesso_banheiro_descanso}
          onValueChange={(value) => onChange({ ...data, acesso_banheiro_descanso: value })}
        />
      </div>

      {/* B.3.4: Acidente de trabalho */}
      <div className="space-y-3">
        <Label>Já sofreu acidente durante o trabalho na plataforma?</Label>
        <SimNaoRadio
          id="acidente"
          value={data.sofreu_acidente}
          onValueChange={(value) => onChange({ ...data, sofreu_acidente: value })}
        />

        {mostrarAssistencia && (
          <div className="space-y-3">
            <Label>A plataforma prestou alguma assistência após o acidente?</Label>
            <SimNaoRadio
              id="assistencia-acidente"
              value={data.plataforma_assistiu_acidente}
              onValueChange={(value) => onChange({ ...data, plataforma_assistiu_acidente: value })}
            />
          </div>
        )}
      </div>

      {/* B.3.5: EPI */}
      <div className="space-y-3">
        <Label>A plataforma fornecia equipamento de segurança (capacete, colete, etc.)?</Label>
        <SimNaoRadio
          id="fornece-epi"
          value={data.plataforma_fornece_epi}
          onValueChange={(value) => onChange({ ...data, plataforma_fornece_epi: value })}
        />
      </div>

      {/* B.3.6: Seguro */}
      <div className="space-y-3">
        <Label>Existia algum seguro oferecido pela plataforma?</Label>
        <SimNaoRadio
          id="seguro"
          value={data.possui_seguro}
          onValueChange={(value) => onChange({ ...data, possui_seguro: value })}
        />
      </div>

      {/* B.3.7: Narrativa */}
      <div className="space-y-2">
        <Label htmlFor="narrativa-condicoes">Descreva suas condições de trabalho na plataforma</Label>
        <Textarea
          id="narrativa-condicoes"
          placeholder="Narre como era o dia a dia: onde almoçava, onde descansava, como era quando chovia, se levava sol/chuva..."
          value={data.narrativa_condicoes ?? ''}
          onChange={(e) => onChange({ ...data, narrativa_condicoes: e.target.value })}
          rows={5}
        />
        <OperadorAlert tipo="info">
          A falta de acesso a banheiro e descanso viola a NR-17 (ergonomia) e princípios de dignidade (art. 1°, III, CF). Fotos e relatos sobre condições precárias fortalecem a tese.
        </OperadorAlert>
      </div>
    </div>
  );
}
