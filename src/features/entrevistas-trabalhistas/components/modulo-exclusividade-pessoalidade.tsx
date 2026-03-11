'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  PROIBICAO_OUTROS_OPTIONS,
  DURACAO_RELACAO_OPTIONS,
} from '../domain';
import type {
  RespostasExclusividadePessoalidade,
  ProibicaoOutrosClientes,
  DuracaoRelacao,
} from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloExclusividadePessoalidadeProps {
  data: RespostasExclusividadePessoalidade;
  onChange: (data: RespostasExclusividadePessoalidade) => void;
}

export function ModuloExclusividadePessoalidade({ data, onChange }: ModuloExclusividadePessoalidadeProps) {
  const forteIndicioVinculo = data.atende_exclusivamente === true && data.pode_enviar_substituto === false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Só Você Serve</h3>
        <p className="text-sm text-muted-foreground">
          Avaliar exclusividade e pessoalidade — indícios fortes de vínculo disfarçado
        </p>
      </div>

      {/* C.3.1: Exclusividade */}
      <div className="space-y-3">
        <Label>Atendia exclusivamente esta empresa (não tinha outros clientes PJ)?</Label>
        <SimNaoRadio
          id="atende-exclusivamente"
          value={data.atende_exclusivamente}
          onValueChange={(value) => onChange({ ...data, atende_exclusivamente: value })}
          labelSim="Sim, apenas esta empresa"
          labelNao="Não, tinha outros clientes"
        />
      </div>

      {/* C.3.2: Pessoalidade */}
      <div className="space-y-3">
        <Label>Poderia enviar outra pessoa no seu lugar para fazer o trabalho?</Label>
        <SimNaoRadio
          id="pode-enviar-substituto"
          value={data.pode_enviar_substituto}
          onValueChange={(value) => onChange({ ...data, pode_enviar_substituto: value })}
          labelSim="Sim, poderia mandar qualquer um"
          labelNao="Não, tinha que ser eu pessoalmente"
        />
      </div>

      {forteIndicioVinculo && (
        <OperadorAlert tipo="aviso">
          <strong>Exclusividade + pessoalidade = forte indício de vínculo!</strong> Se o trabalhador atendia apenas uma empresa e não podia se fazer substituir, a relação é de emprego, não de prestação de serviços. A jurisprudência do TST é consolidada nesse sentido.
        </OperadorAlert>
      )}

      {/* C.3.3: Proibição de outros clientes */}
      <div className="space-y-2">
        <Label htmlFor="proibicao">A empresa proibia (formal ou informalmente) que atendesse outros clientes?</Label>
        <Select
          value={data.proibicao_outros_clientes ?? ''}
          onValueChange={(v) => onChange({ ...data, proibicao_outros_clientes: v as ProibicaoOutrosClientes })}
        >
          <SelectTrigger id="proibicao">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {PROIBICAO_OUTROS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.3.4: Liberdade de recusar tarefas */}
      <div className="space-y-3">
        <Label>Tinha liberdade para recusar tarefas ou projetos da empresa?</Label>
        <SimNaoRadio
          id="liberdade-recusar"
          value={data.liberdade_recusar_tarefas}
          onValueChange={(value) => onChange({ ...data, liberdade_recusar_tarefas: value })}
        />
      </div>

      {/* C.3.5: Duração da relação */}
      <div className="space-y-2">
        <Label htmlFor="duracao">Quanto tempo durou sua relação com esta empresa?</Label>
        <Select
          value={data.duracao_relacao ?? ''}
          onValueChange={(v) => onChange({ ...data, duracao_relacao: v as DuracaoRelacao })}
        >
          <SelectTrigger id="duracao">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {DURACAO_RELACAO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(data.duracao_relacao === '1a_3a' || data.duracao_relacao === 'mais_3a') && (
          <OperadorAlert tipo="info">
            Relação de longa duração com um único tomador reforça a habitualidade (não-eventualidade), outro requisito do art. 3° CLT para reconhecimento de vínculo.
          </OperadorAlert>
        )}
      </div>
    </div>
  );
}
