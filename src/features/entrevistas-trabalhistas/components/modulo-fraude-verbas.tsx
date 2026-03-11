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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BENEFICIO_RECEBIDO_OPTIONS,
  REGIME_FERIAS_OPTIONS,
} from '../domain';
import type {
  RespostasFraudeVerbas,
  BeneficioRecebido,
  RegimeFerias,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloFraudeVerbasProps {
  data: RespostasFraudeVerbas;
  onChange: (data: RespostasFraudeVerbas) => void;
}

export function ModuloFraudeVerbas({ data, onChange }: ModuloFraudeVerbasProps) {
  const beneficios = data.beneficios_recebidos ?? [];

  const toggleBeneficio = (value: BeneficioRecebido, checked: boolean) => {
    let updated = checked
      ? [...beneficios, value]
      : beneficios.filter((v) => v !== value);

    // "nenhum" is mutually exclusive with concrete benefits.
    if (checked && value === 'nenhum') {
      updated = ['nenhum'];
    }

    if (checked && value !== 'nenhum') {
      updated = updated.filter((v) => v !== 'nenhum');
    }

    onChange({ ...data, beneficios_recebidos: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">O Que Você Perdeu</h3>
        <p className="text-sm text-muted-foreground">
          Calcular os prejuízos trabalhistas decorrentes da pejotização
        </p>
      </div>

      {/* C.4.1: Valor mensal fixo */}
      <div className="space-y-3">
        <Label>Recebia um valor mensal fixo (como um salário)?</Label>
        <SimNaoRadio
          id="fixo"
          value={data.valor_mensal_fixo}
          onValueChange={(value) => onChange({ ...data, valor_mensal_fixo: value })}
        />

        {data.valor_mensal_fixo === true && (
          <div className="space-y-2">
            <Label htmlFor="valor-aprox">Valor aproximado</Label>
            <Input
              id="valor-aprox"
              placeholder="Ex: R$ 5.000,00"
              value={data.valor_aproximado ?? ''}
              onChange={(e) => onChange({ ...data, valor_aproximado: e.target.value })}
              className="max-w-48"
            />
          </div>
        )}
      </div>

      {/* C.4.2: Benefícios recebidos */}
      <div className="space-y-3">
        <Label>Recebia algum desses benefícios da empresa?</Label>
        <div className="space-y-2">
          {BENEFICIO_RECEBIDO_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`beneficio-${opt.value}`}
                checked={beneficios.includes(opt.value)}
                onCheckedChange={(checked) =>
                  toggleBeneficio(opt.value, checked === true)
                }
              />
              <Label htmlFor={`beneficio-${opt.value}`} className="cursor-pointer text-sm font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* C.4.3: 13° disfarçado */}
      <div className="space-y-3">
        <Label>Havia algum &quot;bônus de fim de ano&quot; que funcionava como 13° salário?</Label>
        <SimNaoRadio
          id="decimo-terceiro"
          value={data.decimo_terceiro_disfarado}
          onValueChange={(value) => onChange({ ...data, decimo_terceiro_disfarado: value })}
        />
      </div>

      {/* C.4.4: Férias */}
      <div className="space-y-2">
        <Label htmlFor="ferias">Como funcionavam as férias?</Label>
        <Select
          value={data.regime_ferias ?? ''}
          onValueChange={(v) => onChange({ ...data, regime_ferias: v as RegimeFerias })}
        >
          <SelectTrigger id="ferias">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {REGIME_FERIAS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.4.5: Verbas rescisórias */}
      <div className="space-y-3">
        <Label>Ao sair da empresa, recebeu alguma verba rescisória?</Label>
        <SimNaoRadio
          id="rescisao"
          value={data.recebeu_verbas_rescisao}
          onValueChange={(value) => onChange({ ...data, recebeu_verbas_rescisao: value })}
        />
      </div>

      {/* C.4.6: Controle como CLT */}
      <div className="space-y-3">
        <Label>O pagamento era feito na PJ, mas o controle do trabalho era como CLT?</Label>
        <SimNaoRadio
          id="controle-clt"
          value={data.controle_como_clt}
          onValueChange={(value) => onChange({ ...data, controle_como_clt: value })}
        />
      </div>

      <OperadorAlert tipo="info">
        Na pejotização reconhecida judicialmente, o trabalhador tem direito retroativo a: FGTS + multa de 40%, 13° salário, férias + 1/3, aviso prévio, INSS, seguro-desemprego e horas extras. Solicite comprovantes de pagamento (extratos, NFs emitidas) para cálculo do valor da causa.
      </OperadorAlert>
    </div>
  );
}
