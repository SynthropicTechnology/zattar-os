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
  PERCENTUAL_RENDA_OPTIONS,
  QTD_PLATAFORMAS_OPTIONS,
} from '../domain';
import type {
  RespostasDependenciaEconomica,
  PercentualRenda,
  QtdPlataformas,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloDependenciaEconomicaProps {
  data: RespostasDependenciaEconomica;
  onChange: (data: RespostasDependenciaEconomica) => void;
}

export function ModuloDependenciaEconomica({ data, onChange }: ModuloDependenciaEconomicaProps) {
  const mostrarInvestimento = data.investimento_especifico === true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Preso na Plataforma</h3>
        <p className="text-sm text-muted-foreground">
          Avaliar o grau de dependência econômica do trabalhador em relação à plataforma
        </p>
      </div>

      {/* B.2.1: Percentual da renda */}
      <div className="space-y-2">
        <Label htmlFor="percentual">Qual porcentagem da sua renda vinha da plataforma?</Label>
        <Select
          value={data.percentual_renda ?? ''}
          onValueChange={(v) => onChange({ ...data, percentual_renda: v as PercentualRenda })}
        >
          <SelectTrigger id="percentual">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {PERCENTUAL_RENDA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* B.2.2: Quantidade de plataformas */}
      <div className="space-y-2">
        <Label htmlFor="qtd-plataformas">Em quantas plataformas trabalhava simultaneamente?</Label>
        <Select
          value={data.qtd_plataformas ?? ''}
          onValueChange={(v) => onChange({ ...data, qtd_plataformas: v as QtdPlataformas })}
        >
          <SelectTrigger id="qtd-plataformas">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {QTD_PLATAFORMAS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* B.2.3: Investimento específico */}
      <div className="space-y-3">
        <Label>Fez algum investimento específico para trabalhar na plataforma? (moto, bag, celular, carro)</Label>
        <SimNaoRadio
          id="investimento"
          value={data.investimento_especifico}
          onValueChange={(value) => onChange({ ...data, investimento_especifico: value })}
        />

        {mostrarInvestimento && (
          <div className="space-y-2">
            <Label htmlFor="desc-investimento">Descreva o investimento feito</Label>
            <Textarea
              id="desc-investimento"
              placeholder="Ex: Comprei uma moto financiada para fazer entregas, bag térmica, celular com suporte..."
              value={data.descricao_investimento ?? ''}
              onChange={(e) => onChange({ ...data, descricao_investimento: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </div>

      {/* B.2.4: Única fonte de renda */}
      <div className="space-y-3">
        <Label>A plataforma era sua única fonte de renda?</Label>
        <SimNaoRadio
          id="unica-fonte-renda"
          value={data.unica_fonte_renda}
          onValueChange={(value) => onChange({ ...data, unica_fonte_renda: value })}
        />
      </div>

      {/* B.2.5: Exclusividade */}
      <div className="space-y-3">
        <Label>Havia cláusula de exclusividade (formal ou informal) com a plataforma?</Label>
        <SimNaoRadio
          id="clausula-exclusividade"
          value={data.clausula_exclusividade}
          onValueChange={(value) => onChange({ ...data, clausula_exclusividade: value })}
        />
      </div>

      <OperadorAlert tipo="info">
        A dependência econômica é forte indício de vínculo. Se mais de 50% da renda vem da plataforma e houve investimento específico (moto, bag), a jurisprudência tende a reconhecer a relação de emprego. Solicite extratos bancários que comprovem a exclusividade de renda.
      </OperadorAlert>
    </div>
  );
}
