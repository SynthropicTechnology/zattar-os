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

      {/* B.1.3: Definição de preço */}
      <div className="space-y-3">
        <Label>A plataforma define o preço do serviço (você não pode negociar com o cliente)?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="preco-sim"
              checked={data.plataforma_define_preco === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, plataforma_define_preco: checked === true })
              }
            />
            <Label htmlFor="preco-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="preco-nao"
              checked={data.plataforma_define_preco === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, plataforma_define_preco: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="preco-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="avaliacao-sim"
              checked={data.sistema_avaliacao === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, sistema_avaliacao: checked === true })
              }
            />
            <Label htmlFor="avaliacao-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="avaliacao-nao"
              checked={data.sistema_avaliacao === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, sistema_avaliacao: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="avaliacao-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* B.1.6: Punição por nota baixa (condicional) */}
      {data.sistema_avaliacao === true && (
        <div className="space-y-3">
          <Label>Já foi punido por nota baixa?</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="punido-sim"
                checked={data.punido_nota_baixa === true}
                onCheckedChange={(checked) =>
                  onChange({ ...data, punido_nota_baixa: checked === true })
                }
              />
              <Label htmlFor="punido-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="punido-nao"
                checked={data.punido_nota_baixa === false}
                onCheckedChange={(checked) =>
                  onChange({ ...data, punido_nota_baixa: checked === true ? false : undefined })
                }
              />
              <Label htmlFor="punido-nao" className="cursor-pointer text-sm font-normal">Não</Label>
            </div>
          </div>

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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="gps-sim"
              checked={data.monitoramento_gps === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, monitoramento_gps: checked === true })
              }
            />
            <Label htmlFor="gps-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="gps-nao"
              checked={data.monitoramento_gps === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, monitoramento_gps: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="gps-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* B.1.8: Meta de aceitação */}
      <div className="space-y-3">
        <Label>Existe meta ou taxa mínima de aceitação de corridas/serviços?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="meta-sim"
              checked={data.meta_aceitacao_minima === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, meta_aceitacao_minima: checked === true })
              }
            />
            <Label htmlFor="meta-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="meta-nao"
              checked={data.meta_aceitacao_minima === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, meta_aceitacao_minima: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="meta-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
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
