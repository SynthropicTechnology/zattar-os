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
  FORMA_DESLIGAMENTO_OPTIONS,
  TEMPO_PLATAFORMA_OPTIONS,
} from '../domain';
import type {
  RespostasDesligamentoPlataforma,
  FormaDesligamento,
  TempoPlataforma,
} from '../domain';
import { OperadorAlert } from './operador-alert';

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

      {foiBloqueado && (
        <>
          {/* B.4.2: Aviso prévio */}
          <div className="space-y-3">
            <Label>Recebeu aviso prévio antes do bloqueio/desativação?</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="aviso-sim"
                  checked={data.aviso_previo === true}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, aviso_previo: checked === true })
                  }
                />
                <Label htmlFor="aviso-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="aviso-nao"
                  checked={data.aviso_previo === false}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, aviso_previo: checked === true ? false : undefined })
                  }
                />
                <Label htmlFor="aviso-nao" className="cursor-pointer text-sm font-normal">Não</Label>
              </div>
            </div>
          </div>

          {/* B.4.3: Direito de defesa */}
          <div className="space-y-3">
            <Label>Teve direito a defesa ou contestação antes do desligamento?</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="defesa-sim"
                  checked={data.direito_defesa === true}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, direito_defesa: checked === true })
                  }
                />
                <Label htmlFor="defesa-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="defesa-nao"
                  checked={data.direito_defesa === false}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, direito_defesa: checked === true ? false : undefined })
                  }
                />
                <Label htmlFor="defesa-nao" className="cursor-pointer text-sm font-normal">Não</Label>
              </div>
            </div>
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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="saldo-sim"
              checked={data.saldo_retido === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, saldo_retido: checked === true })
              }
            />
            <Label htmlFor="saldo-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="saldo-nao"
              checked={data.saldo_retido === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, saldo_retido: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="saldo-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>

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
