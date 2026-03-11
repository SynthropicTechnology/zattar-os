'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CONTROLE_PONTO_OPTIONS } from '../domain';
import type { RespostasJornada, ControlePonto } from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloJornadaProps {
  data: RespostasJornada;
  onChange: (data: RespostasJornada) => void;
}

export function ModuloJornada({ data, onChange }: ModuloJornadaProps) {
  const controlePonto = data.controle_ponto ?? [];
  const mostrarAlertaOnus =
    controlePonto.includes('manual') || controlePonto.includes('britanico');
  const intervaloReduzido = data.intervalo_concedido === false;

  const toggleControlePonto = (value: ControlePonto, checked: boolean) => {
    const current = controlePonto;
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    onChange({ ...data, controle_ponto: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Apropriação do Tempo</h3>
        <p className="text-sm text-muted-foreground">
          Jornada de trabalho, horas extras e intervalos
        </p>
      </div>

      {/* A.2.1: Controle de ponto */}
      <div className="space-y-3">
        <Label>Como era registrado o horário de entrada e saída?</Label>
        <div className="space-y-2">
          {CONTROLE_PONTO_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`ponto-${opt.value}`}
                checked={controlePonto.includes(opt.value)}
                onCheckedChange={(checked) =>
                  toggleControlePonto(opt.value, checked === true)
                }
              />
              <Label htmlFor={`ponto-${opt.value}`} className="cursor-pointer text-sm font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip inversão de ônus */}
      {mostrarAlertaOnus && (
        <OperadorAlert tipo="aviso">
          <strong>Atenção:</strong> o ônus da prova pode ser invertido. Questione sobre testemunhas que possam confirmar a jornada real.
        </OperadorAlert>
      )}

      {/* A.2.2: Intervalo */}
      <div className="space-y-3">
        <Label>Conseguia tirar 1 hora inteira de almoço/descanso?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="intervalo-sim"
              checked={data.intervalo_concedido === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, intervalo_concedido: checked === true })
              }
            />
            <Label htmlFor="intervalo-sim" className="cursor-pointer text-sm font-normal">
              Sim, tirava 1h completa
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="intervalo-nao"
              checked={data.intervalo_concedido === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, intervalo_concedido: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="intervalo-nao" className="cursor-pointer text-sm font-normal">
              Não, era reduzido
            </Label>
          </div>
        </div>
      </div>

      {/* Campo condicional: minutos reais */}
      {intervaloReduzido && (
        <div className="space-y-2">
          <Label htmlFor="minutos-intervalo">Quantos minutos de intervalo realmente tinha?</Label>
          <Input
            id="minutos-intervalo"
            type="number"
            min={0}
            max={60}
            placeholder="Ex: 20"
            value={data.minutos_intervalo_real ?? ''}
            onChange={(e) =>
              onChange({
                ...data,
                minutos_intervalo_real: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            className="max-w-32"
          />
        </div>
      )}

      {/* Horas extras */}
      <div className="space-y-3">
        <Label>Recebia pelas horas a mais que trabalhava?</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="he-pagas"
              checked={data.horas_extras_pagas === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, horas_extras_pagas: checked === true })
              }
            />
            <Label htmlFor="he-pagas" className="cursor-pointer text-sm font-normal">
              Recebia todas as horas extras
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bh-nao-compensado"
              checked={data.banco_horas_compensado === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, banco_horas_compensado: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="bh-nao-compensado" className="cursor-pointer text-sm font-normal">
              Fazia hora extra de graça ou ia para banco de horas que nunca folgava
            </Label>
          </div>
        </div>
      </div>

      {/* Narrativa do dia típico */}
      <div className="space-y-2">
        <Label htmlFor="dia-tipico">Descreva um dia típico de trabalho</Label>
        <Textarea
          id="dia-tipico"
          placeholder="Narre o dia de trabalho do cliente, desde a hora que chegava até a hora que saía..."
          value={data.narrativa_dia_tipico ?? ''}
          onChange={(e) => onChange({ ...data, narrativa_dia_tipico: e.target.value })}
          rows={5}
        />
        <OperadorAlert tipo="info">
          Grave áudio do cliente narrando um dia típico de trabalho, focando na pressão por tempo.
        </OperadorAlert>
      </div>
    </div>
  );
}
