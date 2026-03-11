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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="banheiro-sim"
              checked={data.acesso_banheiro_descanso === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, acesso_banheiro_descanso: checked === true })
              }
            />
            <Label htmlFor="banheiro-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="banheiro-nao"
              checked={data.acesso_banheiro_descanso === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, acesso_banheiro_descanso: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="banheiro-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* B.3.4: Acidente de trabalho */}
      <div className="space-y-3">
        <Label>Já sofreu acidente durante o trabalho na plataforma?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="acidente-sim"
              checked={data.sofreu_acidente === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, sofreu_acidente: checked === true })
              }
            />
            <Label htmlFor="acidente-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="acidente-nao"
              checked={data.sofreu_acidente === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, sofreu_acidente: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="acidente-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>

        {mostrarAssistencia && (
          <div className="space-y-3">
            <Label>A plataforma prestou alguma assistência após o acidente?</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="assist-sim"
                  checked={data.plataforma_assistiu_acidente === true}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, plataforma_assistiu_acidente: checked === true })
                  }
                />
                <Label htmlFor="assist-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="assist-nao"
                  checked={data.plataforma_assistiu_acidente === false}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, plataforma_assistiu_acidente: checked === true ? false : undefined })
                  }
                />
                <Label htmlFor="assist-nao" className="cursor-pointer text-sm font-normal">Não</Label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* B.3.5: EPI */}
      <div className="space-y-3">
        <Label>A plataforma fornecia equipamento de segurança (capacete, colete, etc.)?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="epi-sim"
              checked={data.plataforma_fornece_epi === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, plataforma_fornece_epi: checked === true })
              }
            />
            <Label htmlFor="epi-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="epi-nao"
              checked={data.plataforma_fornece_epi === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, plataforma_fornece_epi: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="epi-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* B.3.6: Seguro */}
      <div className="space-y-3">
        <Label>Existia algum seguro oferecido pela plataforma?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="seguro-sim"
              checked={data.possui_seguro === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, possui_seguro: checked === true })
              }
            />
            <Label htmlFor="seguro-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="seguro-nao"
              checked={data.possui_seguro === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, possui_seguro: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="seguro-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
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
