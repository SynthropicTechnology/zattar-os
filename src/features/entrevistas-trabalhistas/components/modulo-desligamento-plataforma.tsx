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
  FORMA_DESLIGAMENTO_OPTIONS,
  TEMPO_PLATAFORMA_OPTIONS,
} from '../domain';
import type {
  RespostasDesligamentoPlataforma,
  FormaDesligamento,
  TempoPlataforma,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloDesligamentoPlataformaProps {
  data: RespostasDesligamentoPlataforma;
  onChange: (data: RespostasDesligamentoPlataforma) => void;
}

export function ModuloDesligamentoPlataforma({ data, onChange }: ModuloDesligamentoPlataformaProps) {
  const foiBloqueado = data.forma_desligamento === 'bloqueio_definitivo' ||
    data.forma_desligamento === 'bloqueio_temporario' ||
    data.forma_desligamento === 'conta_desativada';
  const mostrarValorRetido = data.saldo_retido === true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Desligado pelo Algoritmo</h3>
        <p className="text-sm text-muted-foreground">
          Como foi encerrada a relação com a plataforma
        </p>
      </div>

      {/* B.4.1: Forma de desligamento */}
      <div className="space-y-2">
        <Label htmlFor="forma-desligamento">Como foi encerrada sua relação com a plataforma?</Label>
        <Select
          value={data.forma_desligamento ?? ''}
          onValueChange={(v) => onChange({ ...data, forma_desligamento: v as FormaDesligamento })}
        >
          <SelectTrigger id="forma-desligamento">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {FORMA_DESLIGAMENTO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="data-fim-plataforma">Data de encerramento na plataforma</Label>
        <Input
          id="data-fim-plataforma"
          type="date"
          value={data.data_fim_plataforma ?? ''}
          onChange={(e) => onChange({ ...data, data_fim_plataforma: e.target.value })}
        />
      </div>

      {foiBloqueado && (
        <>
          {/* B.4.2: Aviso prévio */}
          <div className="space-y-3">
            <Label>Recebeu aviso prévio antes do bloqueio/desativação?</Label>
            <SimNaoRadio
              id="aviso-previo"
              value={data.aviso_previo}
              onValueChange={(value) => onChange({ ...data, aviso_previo: value })}
            />
          </div>

          {/* B.4.3: Direito de defesa */}
          <div className="space-y-3">
            <Label>Teve direito a defesa ou contestação antes do desligamento?</Label>
            <SimNaoRadio
              id="direito-defesa"
              value={data.direito_defesa}
              onValueChange={(value) => onChange({ ...data, direito_defesa: value })}
            />
          </div>

          {/* B.4.4: Motivo informado */}
          <div className="space-y-2">
            <Label htmlFor="motivo-informado">Qual motivo foi informado pela plataforma (se algum)?</Label>
            <Textarea
              id="motivo-informado"
              placeholder="Descreva o motivo dado pela plataforma, ou se não recebeu nenhuma explicação..."
              value={data.motivo_informado ?? ''}
              onChange={(e) => onChange({ ...data, motivo_informado: e.target.value })}
              rows={3}
            />
          </div>

          <OperadorAlert tipo="aviso">
            O bloqueio unilateral sem aviso prévio e sem direito de defesa tem sido equiparado à dispensa sem justa causa em diversas decisões do TRT-2 e TRT-15. Solicite prints/e-mails da notificação de bloqueio.
          </OperadorAlert>
        </>
      )}

      {/* B.4.5: Saldo retido */}
      <div className="space-y-3">
        <Label>Havia saldo/ganhos retidos pela plataforma no momento do desligamento?</Label>
        <SimNaoRadio
          id="saldo-retido"
          value={data.saldo_retido}
          onValueChange={(value) => onChange({ ...data, saldo_retido: value })}
        />

        {mostrarValorRetido && (
          <div className="space-y-2">
            <Label htmlFor="valor-retido">Valor aproximado retido</Label>
            <Input
              id="valor-retido"
              placeholder="Ex: R$ 500,00"
              value={data.valor_retido_aproximado ?? ''}
              onChange={(e) => onChange({ ...data, valor_retido_aproximado: e.target.value })}
              className="max-w-48"
            />
          </div>
        )}
      </div>

      {/* B.4.6: Tempo na plataforma */}
      <div className="space-y-2">
        <Label htmlFor="tempo-plataforma">Quanto tempo trabalhou na plataforma?</Label>
        <Select
          value={data.tempo_plataforma ?? ''}
          onValueChange={(v) => onChange({ ...data, tempo_plataforma: v as TempoPlataforma })}
        >
          <SelectTrigger id="tempo-plataforma">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {TEMPO_PLATAFORMA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
