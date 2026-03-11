'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { RespostasConsolidacaoFinal } from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloConsolidacaoFinalProps {
  data: RespostasConsolidacaoFinal;
  onChange: (data: RespostasConsolidacaoFinal) => void;
}

export function ModuloConsolidacaoFinal({ data, onChange }: ModuloConsolidacaoFinalProps) {
  const inconsistencias = data.inconsistencias_ia ?? [];
  const justificativas = data.justificativas_inconsistencias ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Consolidacao Final da Entrevista</h3>
        <p className="text-sm text-muted-foreground">
          Sintetize o relato integral e anexe a entrevista completa (audio e manuscrito, quando houver).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relato-completo-texto">Relato completo em texto</Label>
        <Textarea
          id="relato-completo-texto"
          value={data.relato_completo_texto ?? ''}
          onChange={(e) => onChange({ ...data, relato_completo_texto: e.target.value })}
          placeholder="Consolide em ordem cronologica os fatos, informacoes tipadas e principais provas citadas durante a entrevista..."
          rows={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes-finais">Observacoes finais do operador</Label>
        <Textarea
          id="observacoes-finais"
          value={data.observacoes_finais ?? ''}
          onChange={(e) => onChange({ ...data, observacoes_finais: e.target.value })}
          placeholder="Pontos de atencao, duvidas pendentes e orientacoes para redacao da peticao inicial."
          rows={5}
        />
      </div>

      {data.relato_consolidado_ia && (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
          <Label htmlFor="relato-ia">Relato consolidado pela IA</Label>
          <Textarea
            id="relato-ia"
            value={data.relato_consolidado_ia}
            onChange={(e) => onChange({ ...data, relato_consolidado_ia: e.target.value })}
            rows={10}
          />
        </div>
      )}

      {inconsistencias.length > 0 && (
        <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-50/40 p-4">
          <h4 className="text-sm font-semibold">Inconsistencias/lacunas apontadas pela IA</h4>
          {inconsistencias.map((item, index) => (
            <div key={`${item}-${index}`} className="space-y-2">
              <p className="text-sm">{item}</p>
              <Textarea
                value={justificativas[item] ?? ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    justificativas_inconsistencias: {
                      ...justificativas,
                      [item]: e.target.value,
                    },
                  })
                }
                rows={3}
                placeholder="Justifique por que o ponto nao e relevante ou descreva como foi sanado."
              />
            </div>
          ))}
        </div>
      )}

      <OperadorAlert tipo="info">
        Nesta etapa, envie os anexos finais da entrevista: gravacao completa em audio, texto manuscrito digitalizado e quaisquer documentos complementares.
      </OperadorAlert>
    </div>
  );
}
