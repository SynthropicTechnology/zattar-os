'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  TIPO_PLATAFORMA_OPTIONS,
  RECUSA_CONSEQUENCIA_OPTIONS,
} from '../domain';
import type {
  RespostasControleAlgoritmico,
  TipoPlataforma,
  RecusaConsequencia,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloControleAlgoritmicoProps {
  data: RespostasControleAlgoritmico;
  onChange: (data: RespostasControleAlgoritmico) => void;
}

export function ModuloControleAlgoritmico({ data, onChange }: ModuloControleAlgoritmicoProps) {
  const mostrarPunicao = data.punido_nota_baixa === true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">O Algoritmo que Manda</h3>
        <p className="text-sm text-muted-foreground">
          Investigar como a plataforma controla o trabalhador por meio de algoritmos
        </p>
      </div>

      {/* B.1.1: Tipo de plataforma */}
      <div className="space-y-2">
        <Label htmlFor="tipo-plataforma">Qual o tipo de serviço que prestava pela plataforma?</Label>
        <Select
          value={data.tipo_plataforma ?? ''}
          onValueChange={(v) => onChange({ ...data, tipo_plataforma: v as TipoPlataforma })}
        >
          <SelectTrigger id="tipo-plataforma">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {TIPO_PLATAFORMA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* B.1.2: Nome da plataforma */}
      <div className="space-y-2">
        <Label htmlFor="nome-plataforma">Nome da plataforma principal</Label>
        <Input
          id="nome-plataforma"
          placeholder="Ex: Uber, iFood, 99, Rappi..."
          value={data.nome_plataforma ?? ''}
          onChange={(e) => onChange({ ...data, nome_plataforma: e.target.value })}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="renda-mensal-media">Renda mensal média na plataforma</Label>
          <Input
            id="renda-mensal-media"
            placeholder="Ex: R$ 3.800,00"
            value={data.renda_mensal_media ?? ''}
            onChange={(e) => onChange({ ...data, renda_mensal_media: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="data-inicio-plataforma">Data de início na plataforma</Label>
          <Input
            id="data-inicio-plataforma"
            type="date"
            value={data.data_inicio_plataforma ?? ''}
            onChange={(e) => onChange({ ...data, data_inicio_plataforma: e.target.value })}
          />
        </div>
      </div>

      {/* B.1.3: Definição de preço */}
      <div className="space-y-3">
        <Label>A plataforma define o preço do serviço (você não pode negociar com o cliente)?</Label>
        <SimNaoRadio
          id="define-preco"
          value={data.plataforma_define_preco}
          onValueChange={(value) => onChange({ ...data, plataforma_define_preco: value })}
        />
        {data.plataforma_define_preco === true && (
          <OperadorAlert tipo="info">
            A definição unilateral de preço pelo app é forte indício de subordinação algorítmica (art. 3° CLT). O trabalhador autônomo real negocia seus próprios preços.
          </OperadorAlert>
        )}
      </div>

      {/* B.1.4: Recusa de corrida */}
      <div className="space-y-2">
        <Label htmlFor="recusa">Pode recusar corridas/entregas/serviços sem punição?</Label>
        <Select
          value={data.pode_recusar_corrida ?? ''}
          onValueChange={(v) => onChange({ ...data, pode_recusar_corrida: v as RecusaConsequencia })}
        >
          <SelectTrigger id="recusa">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {RECUSA_CONSEQUENCIA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* B.1.5: Sistema de avaliação */}
      <div className="space-y-3">
        <Label>Existe um sistema de nota/avaliação que afeta seu trabalho?</Label>
        <SimNaoRadio
          id="sistema-avaliacao"
          value={data.sistema_avaliacao}
          onValueChange={(value) => onChange({ ...data, sistema_avaliacao: value })}
        />
      </div>

      {/* B.1.6: Punição por nota baixa (condicional) */}
      {data.sistema_avaliacao === true && (
        <div className="space-y-3">
          <Label>Já foi punido por nota baixa?</Label>
          <SimNaoRadio
            id="punicao-nota"
            value={data.punido_nota_baixa}
            onValueChange={(value) => onChange({ ...data, punido_nota_baixa: value })}
          />

          {mostrarPunicao && (
            <div className="space-y-2">
              <Label htmlFor="tipo-punicao">Que tipo de punição sofreu?</Label>
              <Input
                id="tipo-punicao"
                placeholder="Ex: bloqueio temporário, redução de corridas, perda de bônus..."
                value={data.tipo_punicao ?? ''}
                onChange={(e) => onChange({ ...data, tipo_punicao: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {/* B.1.7: GPS */}
      <div className="space-y-3">
        <Label>A plataforma monitora sua localização por GPS em tempo real?</Label>
        <SimNaoRadio
          id="monitoramento-gps"
          value={data.monitoramento_gps}
          onValueChange={(value) => onChange({ ...data, monitoramento_gps: value })}
        />
      </div>

      {/* B.1.8: Meta de aceitação */}
      <div className="space-y-3">
        <Label>Existe meta ou taxa mínima de aceitação de corridas/serviços?</Label>
        <SimNaoRadio
          id="meta-aceitacao"
          value={data.meta_aceitacao_minima}
          onValueChange={(value) => onChange({ ...data, meta_aceitacao_minima: value })}
        />
      </div>

      {/* B.1.9: Narrativa */}
      <div className="space-y-2">
        <Label htmlFor="narrativa-controle">Descreva como a plataforma controlava seu trabalho no dia a dia</Label>
        <Textarea
          id="narrativa-controle"
          placeholder="Narre como o app interferia na sua rotina: avisos, punições, regras sobre vestimenta, veículo, bag..."
          value={data.narrativa_controle ?? ''}
          onChange={(e) => onChange({ ...data, narrativa_controle: e.target.value })}
          rows={5}
        />
        <OperadorAlert tipo="info">
          O TST tem reconhecido que controle por algoritmo (preço, nota, GPS, punição por recusa) configura subordinação nos termos do art. 3° da CLT. Solicite prints do app mostrando avaliações, bloqueios ou mensagens de advertência.
        </OperadorAlert>
      </div>
    </div>
  );
}
