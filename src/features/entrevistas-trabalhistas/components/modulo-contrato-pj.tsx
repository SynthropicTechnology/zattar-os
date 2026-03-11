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
  ORIGEM_PJ_OPTIONS,
  TIPO_PJ_OPTIONS,
  VALOR_PAGAMENTO_OPTIONS,
} from '../domain';
import type {
  RespostasContratoPJ,
  OrigemPJ,
  TipoPJ,
  ValorPagamento,
} from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloContratoPJProps {
  data: RespostasContratoPJ;
  onChange: (data: RespostasContratoPJ) => void;
}

export function ModuloContratoPJ({ data, onChange }: ModuloContratoPJProps) {
  const empresaImpos = data.origem_pj === 'empresa_obrigou' || data.origem_pj === 'empresa_sugeriu';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">A Máscara do CNPJ</h3>
        <p className="text-sm text-muted-foreground">
          Investigar como a relação PJ foi constituída e se houve imposição da empresa
        </p>
      </div>

      {/* C.1.1: Origem do PJ */}
      <div className="space-y-2">
        <Label htmlFor="origem-pj">Quem pediu para você abrir o CNPJ/MEI?</Label>
        <Select
          value={data.origem_pj ?? ''}
          onValueChange={(v) => onChange({ ...data, origem_pj: v as OrigemPJ })}
        >
          <SelectTrigger id="origem-pj">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {ORIGEM_PJ_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {empresaImpos && (
          <OperadorAlert tipo="info">
            A imposição ou sugestão da empresa para abertura de CNPJ é forte indício de fraude (art. 9° CLT). Solicite qualquer comunicação (e-mail, WhatsApp) em que a empresa fez esse pedido.
          </OperadorAlert>
        )}
      </div>

      {/* C.1.2: Tipo de PJ */}
      <div className="space-y-2">
        <Label htmlFor="tipo-pj">Qual o tipo de empresa/regime que abriu?</Label>
        <Select
          value={data.tipo_pj ?? ''}
          onValueChange={(v) => onChange({ ...data, tipo_pj: v as TipoPJ })}
        >
          <SelectTrigger id="tipo-pj">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {TIPO_PJ_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.1.3: Contrato formal */}
      <div className="space-y-3">
        <Label>Existia contrato formal de prestação de serviços assinado?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="contrato-sim"
              checked={data.contrato_formal === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, contrato_formal: checked === true })
              }
            />
            <Label htmlFor="contrato-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="contrato-nao"
              checked={data.contrato_formal === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, contrato_formal: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="contrato-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.1.4: Empresa paga custos CNPJ */}
      <div className="space-y-3">
        <Label>A empresa pagava os custos do CNPJ (contador, impostos, DAS)?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="custos-sim"
              checked={data.empresa_paga_custos_cnpj === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, empresa_paga_custos_cnpj: checked === true })
              }
            />
            <Label htmlFor="custos-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="custos-nao"
              checked={data.empresa_paga_custos_cnpj === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, empresa_paga_custos_cnpj: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="custos-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
        {data.empresa_paga_custos_cnpj === true && (
          <OperadorAlert tipo="info">
            O fato de a empresa arcar com os custos do CNPJ reforça que a PJ era mera formalidade para mascarar o vínculo empregatício.
          </OperadorAlert>
        )}
      </div>

      {/* C.1.5: Emissão de NF */}
      <div className="space-y-3">
        <Label>Emitia nota fiscal mensal para a empresa?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="nf-sim"
              checked={data.emissao_nf_mensal === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, emissao_nf_mensal: checked === true })
              }
            />
            <Label htmlFor="nf-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="nf-nao"
              checked={data.emissao_nf_mensal === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, emissao_nf_mensal: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="nf-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.1.6: Tipo de pagamento */}
      <div className="space-y-2">
        <Label htmlFor="tipo-pagamento">Como era feito o pagamento?</Label>
        <Select
          value={data.tipo_pagamento ?? ''}
          onValueChange={(v) => onChange({ ...data, tipo_pagamento: v as ValorPagamento })}
        >
          <SelectTrigger id="tipo-pagamento">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {VALOR_PAGAMENTO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.1.7: Valor aproximado */}
      <div className="space-y-2">
        <Label htmlFor="valor-mensal">Valor mensal aproximado recebido</Label>
        <Input
          id="valor-mensal"
          placeholder="Ex: R$ 5.000,00"
          value={data.valor_mensal_aproximado ?? ''}
          onChange={(e) => onChange({ ...data, valor_mensal_aproximado: e.target.value })}
          className="max-w-48"
        />
      </div>
    </div>
  );
}
