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

interface ModuloFraudeVerbasProps {
  data: RespostasFraudeVerbas;
  onChange: (data: RespostasFraudeVerbas) => void;
}

export function ModuloFraudeVerbas({ data, onChange }: ModuloFraudeVerbasProps) {
  const beneficios = data.beneficios_recebidos ?? [];

  const toggleBeneficio = (value: BeneficioRecebido, checked: boolean) => {
    const updated = checked
      ? [...beneficios, value]
      : beneficios.filter((v) => v !== value);
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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="fixo-sim"
              checked={data.valor_mensal_fixo === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, valor_mensal_fixo: checked === true })
              }
            />
            <Label htmlFor="fixo-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="fixo-nao"
              checked={data.valor_mensal_fixo === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, valor_mensal_fixo: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="fixo-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>

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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="13-sim"
              checked={data.decimo_terceiro_disfarado === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, decimo_terceiro_disfarado: checked === true })
              }
            />
            <Label htmlFor="13-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="13-nao"
              checked={data.decimo_terceiro_disfarado === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, decimo_terceiro_disfarado: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="13-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="rescisao-sim"
              checked={data.recebeu_verbas_rescisao === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, recebeu_verbas_rescisao: checked === true })
              }
            />
            <Label htmlFor="rescisao-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rescisao-nao"
              checked={data.recebeu_verbas_rescisao === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, recebeu_verbas_rescisao: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="rescisao-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.4.6: Controle como CLT */}
      <div className="space-y-3">
        <Label>O pagamento era feito na PJ, mas o controle do trabalho era como CLT?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="controle-sim"
              checked={data.controle_como_clt === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, controle_como_clt: checked === true })
              }
            />
            <Label htmlFor="controle-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="controle-nao"
              checked={data.controle_como_clt === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, controle_como_clt: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="controle-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      <OperadorAlert tipo="info">
        Na pejotização reconhecida judicialmente, o trabalhador tem direito retroativo a: FGTS + multa de 40%, 13° salário, férias + 1/3, aviso prévio, INSS, seguro-desemprego e horas extras. Solicite comprovantes de pagamento (extratos, NFs emitidas) para cálculo do valor da causa.
      </OperadorAlert>
    </div>
  );
}
