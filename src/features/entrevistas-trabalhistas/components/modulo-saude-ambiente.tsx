'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TIPO_RISCO_OPTIONS } from '../domain';
import type { RespostasSaudeAmbiente, TipoRisco } from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloSaudeAmbienteProps {
  data: RespostasSaudeAmbiente;
  onChange: (data: RespostasSaudeAmbiente) => void;
}

export function ModuloSaudeAmbiente({ data, onChange }: ModuloSaudeAmbienteProps) {
  const tiposRisco = data.tipos_risco ?? [];

  const toggleRisco = (value: TipoRisco, checked: boolean) => {
    const updated = checked
      ? [...tiposRisco, value]
      : tiposRisco.filter((v) => v !== value);
    onChange({ ...data, tipos_risco: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">O Corpo e o Ambiente</h3>
        <p className="text-sm text-muted-foreground">
          Exposição a riscos, insalubridade, periculosidade e assédio
        </p>
      </div>

      {/* A.3.1: Exposição a riscos */}
      <div className="space-y-3">
        <Label>
          No dia a dia, lidava com situações perigosas ou prejudiciais à saúde?
          <span className="ml-1 text-xs text-muted-foreground">
            (Ex: Produtos químicos, câmara fria, eletricidade, moto, hospital)
          </span>
        </Label>
        <RadioGroup
          value={data.exposicao_riscos === undefined ? '' : data.exposicao_riscos ? 'sim' : 'nao'}
          onValueChange={(v) => onChange({ ...data, exposicao_riscos: v === 'sim' })}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sim" id="risco-sim" />
            <Label htmlFor="risco-sim" className="cursor-pointer font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="nao" id="risco-nao" />
            <Label htmlFor="risco-nao" className="cursor-pointer font-normal">Não</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Condicional: Tipificação de riscos */}
      {data.exposicao_riscos && (
        <>
          <div className="space-y-3">
            <Label>Tipo de risco (selecione todos aplicáveis)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIPO_RISCO_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`risco-${opt.value}`}
                    checked={tiposRisco.includes(opt.value)}
                    onCheckedChange={(checked) => toggleRisco(opt.value, checked === true)}
                  />
                  <Label htmlFor={`risco-${opt.value}`} className="cursor-pointer text-sm font-normal">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc-risco">Descreva detalhadamente a exposição ao risco</Label>
            <Textarea
              id="desc-risco"
              placeholder="Descreva o ambiente, os equipamentos, a frequência de exposição..."
              value={data.descricao_risco ?? ''}
              onChange={(e) => onChange({ ...data, descricao_risco: e.target.value })}
              rows={4}
            />
          </div>
        </>
      )}

      {/* A.3.2: Assédio e danos morais */}
      <div className="space-y-3">
        <Label>
          Sofria xingamentos, humilhações constantes do chefe/colegas ou cobranças de metas abusivas?
        </Label>
        <RadioGroup
          value={data.assedio_moral === undefined ? '' : data.assedio_moral ? 'sim' : 'nao'}
          onValueChange={(v) => onChange({ ...data, assedio_moral: v === 'sim' })}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sim" id="assedio-sim" />
            <Label htmlFor="assedio-sim" className="cursor-pointer font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="nao" id="assedio-nao" />
            <Label htmlFor="assedio-nao" className="cursor-pointer font-normal">Não</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Condicional: Detalhamento do assédio */}
      {data.assedio_moral && (
        <>
          <div className="space-y-2">
            <Label htmlFor="relato-assedio">Relato detalhado do(s) evento(s)</Label>
            <Textarea
              id="relato-assedio"
              placeholder="Descreva os episódios de assédio: o que aconteceu, quando, quem estava presente..."
              value={data.relato_assedio ?? ''}
              onChange={(e) => onChange({ ...data, relato_assedio: e.target.value })}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testemunhas-assedio">
              Existem testemunhas ou gravações de áudio/vídeo?
            </Label>
            <Textarea
              id="testemunhas-assedio"
              placeholder="Nomes de testemunhas, se possui gravações..."
              value={data.testemunhas_assedio ?? ''}
              onChange={(e) => onChange({ ...data, testemunhas_assedio: e.target.value })}
              rows={3}
            />
          </div>

          <OperadorAlert tipo="info">
            Solicite prints de WhatsApp com assédio ou gravações de áudio/vídeo como prova.
          </OperadorAlert>
        </>
      )}
    </div>
  );
}
